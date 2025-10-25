export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/db/prisma';
import { format } from 'date-fns';

export default async function AdminMessagesPage() {
  let messages: Array<{
    id: string;
    subject: string;
    senderName: string | null;
    senderEmail: string | null;
    status: string;
    created_at: Date;
  }> = [];

  try {
    messages = await prisma.message.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
      select: {
        id: true,
        subject: true,
        senderName: true,
        senderEmail: true,
        status: true,
        created_at: true,
      },
    });
  } catch (e) {
    console.warn('[Admin Messages] Message table not available or query failed. Proceeding with empty list.');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <div className="bg-white rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="p-2">Datum</th>
              <th className="p-2">Betreff</th>
              <th className="p-2">Von</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {messages.map(m => (
              <tr key={m.id} className="border-t">
                <td className="p-2 whitespace-nowrap">{format(m.created_at, 'yyyy-MM-dd HH:mm')}</td>
                <td className="p-2">{m.subject}</td>
                <td className="p-2">{m.senderName || m.senderEmail || 'Nutzer'}</td>
                <td className="p-2">{m.status}</td>
              </tr>
            ))}
            {messages.length === 0 && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={4}>Keine Nachrichten vorhanden.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


