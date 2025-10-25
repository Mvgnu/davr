import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { sendEmail } from '@/lib/email/sendEmail';
import { checkSimpleRateLimit, simpleMessagesRateLimiter } from '@/lib/simple-rate-limit';

const messageSchema = z.object({
  centerId: z.string().cuid().optional(),
  recipientUserId: z.string().optional(),
  subject: z.string().min(3).max(200),
  content: z.string().min(10).max(5000),
  // Guest fields
  senderName: z.string().min(1).max(100).optional(),
  senderEmail: z.string().email().optional(),
  senderPhone: z.string().max(50).optional(),
  // Honeypot field
  website: z.string().max(0).optional(),
});

export async function POST(request: NextRequest) {
  // Simple rate limit per IP
  const rateLimitResult = await checkSimpleRateLimit(request, simpleMessagesRateLimiter);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { 
        error: 'Too many requests', 
        retryAfter: rateLimitResult.retryAfter 
      }, 
      { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      }
    );
  }

  const session = await getServerSession(authOptions);

  let body: z.infer<typeof messageSchema>;
  try {
    body = messageSchema.parse(await request.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  // Honeypot triggered
  if (body.website) {
    return NextResponse.json({ success: true });
  }

  const isGuest = !session?.user?.id;
  if (isGuest) {
    if (!body.senderName || !body.senderEmail) {
      return NextResponse.json({ error: 'Guest must provide name and email' }, { status: 400 });
    }
  }

  // Resolve recipient: prefer recipientUserId; else try center.managedById; else fallback to support email
  let recipientEmail: string | null = null;
  let recipientUserId: string | null = body.recipientUserId || null;

  if (!recipientUserId && body.centerId) {
    const center = await prisma.recyclingCenter.findUnique({
      where: { id: body.centerId },
      select: { managedById: true, email: true, name: true },
    });
    if (center?.managedById) recipientUserId = center.managedById;
    // If center has a public email, we can use that as recipient
    if (!recipientUserId && center?.email) recipientEmail = center.email;
  }

  if (!recipientEmail && recipientUserId) {
    const user = await prisma.user.findUnique({ where: { id: recipientUserId }, select: { email: true } });
    recipientEmail = user?.email || null;
  }

  // Both recipientUserId and recipientEmail are null - this could be an issue for routing
  if (!recipientUserId && !recipientEmail) {
    console.warn('Message has no recipient - routing to support email');
  }

  // Persist message
  const created = await prisma.message.create({
    data: {
      senderUserId: session?.user?.id || null,
      senderName: isGuest ? body.senderName! : session?.user?.name || null,
      senderEmail: isGuest ? body.senderEmail! : session?.user?.email || null,
      senderPhone: body.senderPhone || null,
      recipientUserId,
      centerId: body.centerId || null,
      subject: body.subject,
      content: body.content,
      status: 'new',
    },
  });

  // Prepare email routing
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@davr-recycling.de';
  const to = recipientEmail || supportEmail;

  const senderLabel = isGuest
    ? `${body.senderName} <${body.senderEmail}>`
    : `${session?.user?.name || 'Nutzer'} <${session?.user?.email || 'keine-email'}>`;

  const text = `Neue Nachricht\n\nVon: ${senderLabel}\nBetreff: ${body.subject}\n\n${body.content}\n\n`;
  const html = `<p><strong>Von:</strong> ${senderLabel}</p><p><strong>Betreff:</strong> ${body.subject}</p><p>${body.content.replace(/\n/g, '<br/>')}</p>`;

  try {
    await sendEmail({ to, subject: `[DAVR] Nachricht: ${body.subject}`, text, html });
    await prisma.message.update({ where: { id: created.id }, data: { status: 'sent' } });
  } catch (e) {
    await prisma.message.update({ where: { id: created.id }, data: { status: 'failed' } });
    console.error('[Send Message Email Error]', e);
    return NextResponse.json({ error: 'Email failed but message saved' }, { status: 202 });
  }

  return NextResponse.json({ success: true });
}


