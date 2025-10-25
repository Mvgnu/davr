'use client';

import React from 'react';
import { MessageItem } from './MessageItem';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  onReply?: (message: Message) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  onReply, 
  isLoading = false, 
  emptyState 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-muted rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-full mb-1"></div>
            <div className="h-3 bg-gray-300 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return emptyState || (
      <div className="text-center py-12 text-muted-foreground">
        <p>Noch keine Nachrichten</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <MessageItem 
          key={message.id} 
          message={message} 
          onReply={onReply} 
        />
      ))}
    </div>
  );
};