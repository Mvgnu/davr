import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: EmailOptions): Promise<void> {
  // Create a transporter using environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    secure: process.env.EMAIL_SERVER_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
  });

  // Send mail with defined transport object
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"DAVR Recycling" <noreply@davr-recycling.de>',
    to,
    subject,
    text,
    html,
  });
} 