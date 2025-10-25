'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Mail, Send, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Message } from './types';

interface MessageItemProps {
  message: Message;
  onReply?: (message: Message) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, onReply }) => {
  // Determine if this is a message received by the current user (i.e., they are the recipient)
  const isOwnMessage = message.recipientUserId !== null;
  const createdAt = typeof message.created_at === 'string' 
    ? new Date(message.created_at) 
    : message.created_at;
  
  const getStatusIcon = () => {
    switch (message.status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'sent':
        return <Send className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={`mb-4 ${isOwnMessage ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-gray-300'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            {message.senderName || message.senderEmail || 'Unbekannter Absender'}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <Badge variant={message.status === 'new' ? 'default' : 'secondary'}>
              {message.status}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {format(createdAt, 'dd.MM.yyyy HH:mm', { locale: de })}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold mb-2">{message.subject}</h3>
        <p className="text-muted-foreground whitespace-pre-line">{message.content}</p>
        <div className="mt-4 flex justify-end">
          {onReply && (
            <button 
              onClick={() => onReply(message)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Antworten
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};