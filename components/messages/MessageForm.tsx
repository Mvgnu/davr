'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Message } from './types';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MessageFormProps {
  recipientId?: string;
  centerId?: string;
  onSend?: () => void;
  placeholder?: string;
  title?: string;
  initialSubject?: string;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  recipientId,
  centerId,
  onSend,
  placeholder = 'Ihre Nachricht...',
  title = 'Nachricht verfassen',
  initialSubject = ''
}) => {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState(initialSubject);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!content.trim()) {
      setError('Bitte geben Sie eine Nachricht ein');
      return;
    }

    if (!subject.trim()) {
      setError('Bitte geben Sie einen Betreff ein');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientUserId: recipientId,
          centerId,
          subject: subject.trim() || 'Neue Nachricht',
          content: content.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Nachricht erfolgreich gesendet');
        setContent('');
        setSubject(initialSubject || '');
        onSend?.();
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Fehler beim Senden der Nachricht';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = 'Netzwerkfehler: Verbindung zum Server konnte nicht hergestellt werden';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {(recipientId || centerId) ? (
            <p className="text-sm text-muted-foreground">
              Ihre Nachricht wird an den gewählten Empfänger gesendet.
            </p>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Hinweis:</strong> Diese Nachricht wird an den Support gesendet, da kein spezifischer Empfänger ausgewählt ist.
              </p>
            </div>
          )}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Betreff <span className="text-destructive">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                if (error && e.target.value.trim()) {
                  setError(null);
                }
              }}
              placeholder="Betreff Ihrer Nachricht"
              className={`w-full p-2 border rounded-md ${error && !subject.trim() ? 'border-destructive' : 'border-input'}`}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Nachricht <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (error && e.target.value.trim()) {
                  setError(null);
                }
              }}
              placeholder={placeholder}
              disabled={isSubmitting}
              className={`min-h-[120px] ${error && !content.trim() ? 'border-destructive' : 'border-input'}`}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !content.trim() || !subject.trim()}>
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Wird gesendet...' : 'Nachricht senden'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};