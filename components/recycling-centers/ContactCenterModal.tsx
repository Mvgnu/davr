'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { Send } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ContactCenterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  centerId?: string;
  recipientUserId?: string;
  centerName?: string;
}

export default function ContactCenterModal({ isOpen, onOpenChange, centerId, recipientUserId, centerName }: ContactCenterModalProps) {
  const { data: session } = useSession();
  const isGuest = !session?.user;

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState(''); // honeypot

  const resetState = () => {
    setSenderName('');
    setSenderEmail('');
    setSenderPhone('');
    setSubject('');
    setContent('');
    setConsent(false);
    setSubmitting(false);
    setError(null);
    setWebsite('');
  };

  const handleSubmit = async () => {
    setError(null);
    
    if (!subject.trim()) {
      setError('Bitte geben Sie einen Betreff ein');
      return;
    }
    
    if (!content.trim()) {
      setError('Bitte geben Sie eine Nachricht ein');
      return;
    }

    if (isGuest) {
      if (!senderName.trim()) {
        setError('Bitte geben Sie Ihren Namen ein');
        return;
      }
      if (!senderEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        setError('Bitte geben Sie eine gültige E-Mail-Adresse ein');
        return;
      }
      if (!consent) {
        setError('Bitte stimmen Sie der Kontaktaufnahme zu');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          centerId,
          recipientUserId,
          subject: subject.trim(),
          content: content.trim(),
          senderName: isGuest ? senderName.trim() : undefined,
          senderEmail: isGuest ? senderEmail.trim() : undefined,
          senderPhone: isGuest ? senderPhone.trim() : undefined,
          website, // honeypot
        }),
      });

      if (res.ok) {
        toast.success('Nachricht erfolgreich gesendet');
        resetState();
        onOpenChange(false);
      } else if (res.status === 429) {
        setError('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
        toast.error('Zu viele Anfragen. Bitte versuchen Sie es später erneut.');
      } else {
        const data = await res.json().catch(() => ({}));
        const errorMsg = data.error || 'Senden fehlgeschlagen.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (e) {
      const errorMsg = 'Netzwerkfehler. Bitte später erneut versuchen.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = subject.trim().length >= 1 && content.trim().length >= 1 && (!isGuest || (senderName.trim() && senderEmail.trim() && consent));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) resetState(); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nachricht an {centerName || 'Recyclingcenter'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {isGuest && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="senderName" className="text-sm font-medium">Ihr Name *</label>
                <Input 
                  id="senderName" 
                  placeholder="Ihr Name" 
                  value={senderName} 
                  onChange={(e) => {
                    setSenderName(e.target.value);
                    if (error && e.target.value.trim()) {
                      setError(null);
                    }
                  }} 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="senderEmail" className="text-sm font-medium">Ihre E-Mail *</label>
                <Input 
                  id="senderEmail"
                  type="email" 
                  placeholder="Ihre E-Mail" 
                  value={senderEmail} 
                  onChange={(e) => {
                    setSenderEmail(e.target.value);
                    if (error && e.target.value.trim()) {
                      setError(null);
                    }
                  }} 
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="senderPhone" className="text-sm font-medium">Telefon (optional)</label>
                <Input 
                  id="senderPhone"
                  className="sm:col-span-2" 
                  placeholder="Telefon (optional)" 
                  value={senderPhone} 
                  onChange={(e) => setSenderPhone(e.target.value)} 
                />
              </div>
            </div>
          )}
          
          {/* Honeypot - hidden field */}
          <div className="hidden">
            <Input placeholder="Ihre Website" value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">Betreff *</label>
            <Input 
              id="subject"
              placeholder="Betreff Ihrer Nachricht" 
              value={subject} 
              onChange={(e) => {
                setSubject(e.target.value);
                if (error && e.target.value.trim()) {
                  setError(null);
                }
              }} 
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">Nachricht *</label>
            <Textarea 
              id="content"
              placeholder="Ihre Nachricht" 
              value={content} 
              onChange={(e) => {
                setContent(e.target.value);
                if (error && e.target.value.trim()) {
                  setError(null);
                }
              }} 
              rows={6} 
            />
          </div>
          
          {isGuest && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <input 
                  type="checkbox" 
                  checked={consent} 
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (error && e.target.checked) {
                      setError(null);
                    }
                  }} 
                  className="mt-1"
                />
                <span>Ich stimme der Kontaktaufnahme per E-Mail zu.</span>
              </label>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              disabled={submitting}
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmit || submitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Wird gesendet...' : 'Nachricht senden'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


