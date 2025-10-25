export interface Message {
  id: string;
  senderName: string | null;
  senderEmail: string | null;
  senderUserId: string | null;
  recipientUserId: string | null;
  centerId: string | null;
  subject: string;
  content: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
}