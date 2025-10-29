'use client';

import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Loader2, MessageCircle, Send, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { NegotiationOffer, NegotiationSnapshot } from '@/types/negotiations';

interface NegotiationOfferComposerProps {
  negotiation: NegotiationSnapshot | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
  onSubmitOffer: (payload: Record<string, unknown>) => Promise<unknown>;
  onAcceptOffer: (payload: Record<string, unknown>) => Promise<unknown>;
  currentUserId?: string | null;
  disabled?: boolean;
}

function formatOffer(offer: NegotiationOffer | null) {
  if (!offer) {
    return 'Noch kein Angebot vorhanden.';
  }

  const parts: string[] = [];
  if (typeof offer.price === 'number') {
    parts.push(`Preis: ${offer.price.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`);
  }
  if (typeof offer.quantity === 'number') {
    parts.push(`Menge: ${offer.quantity}`);
  }
  if (offer.message) {
    parts.push(`Nachricht: "${offer.message}"`);
  }

  return parts.join(' • ');
}

export function NegotiationOfferComposer({
  negotiation,
  role,
  onSubmitOffer,
  onAcceptOffer,
  currentUserId,
  disabled,
}: NegotiationOfferComposerProps) {
  const [price, setPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const lastOffer = negotiation?.offers[0] ?? null;
  const isCounterpartyOffer = useMemo(() => {
    if (!lastOffer || !currentUserId) {
      return false;
    }
    return lastOffer.senderId !== currentUserId;
  }, [currentUserId, lastOffer]);

  const canAccept = Boolean(role !== null && role !== 'ADMIN' && isCounterpartyOffer);
  const isTerminal = negotiation ? ['COMPLETED', 'CANCELLED', 'EXPIRED'].includes(negotiation.status) : false;

  const resetForm = () => {
    setPrice('');
    setQuantity('');
    setMessage('');
    setFormError(null);
  };

  const handleSubmit = async (action: 'COUNTER' | 'ACCEPT') => {
    if (!negotiation || !currentUserId) {
      setFormError('Benutzerkontext fehlt. Bitte erneut anmelden.');
      return;
    }

    const numericPriceRaw = price ? Number.parseFloat(price) : undefined;
    const numericQuantityRaw = quantity ? Number.parseFloat(quantity) : undefined;
    const numericPrice = Number.isFinite(numericPriceRaw as number) ? numericPriceRaw : undefined;
    const numericQuantity = Number.isFinite(numericQuantityRaw as number) ? numericQuantityRaw : undefined;

    if (action === 'COUNTER' && typeof numericPrice !== 'number') {
      setFormError('Bitte geben Sie einen Preis ein.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (action === 'COUNTER') {
        await onSubmitOffer({
          price: numericPrice,
          quantity: numericQuantity,
          message: message || undefined,
          senderId: currentUserId,
        });
        resetForm();
      } else {
        await onAcceptOffer({
          agreedPrice: numericPrice ?? lastOffer?.price ?? undefined,
          agreedQuantity: numericQuantity ?? lastOffer?.quantity ?? undefined,
          note: message || undefined,
        });
        resetForm();
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Aktion fehlgeschlagen');
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionDisabled = disabled || isSubmitting || !negotiation || isTerminal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Angebot & Gegenangebot
        </CardTitle>
        <CardDescription>
          {lastOffer ? (
            <span>
              Letztes Angebot {formatDistanceToNow(new Date(lastOffer.createdAt), { addSuffix: true, locale: de })}:{' '}
              {formatOffer(lastOffer)}
            </span>
          ) : (
            'Starten Sie die Verhandlung mit einem ersten Angebot.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="offer-price">Preis (EUR)</Label>
            <Input
              id="offer-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              disabled={actionDisabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-quantity">Menge</Label>
            <Input
              id="offer-quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={actionDisabled}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="offer-message">Nachricht (optional)</Label>
          <Textarea
            id="offer-message"
            placeholder="Skizzieren Sie Bedingungen oder Fragen..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={actionDisabled}
            rows={3}
          />
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button
          className="w-full"
          onClick={() => handleSubmit('COUNTER')}
          disabled={actionDisabled || !currentUserId}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Gegenangebot senden
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => handleSubmit('ACCEPT')}
          disabled={actionDisabled || !canAccept}
        >
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
          Angebot akzeptieren
        </Button>
        {!canAccept && lastOffer && (
          <p className="text-xs text-muted-foreground text-center">
            Nur der Verhandlungspartner kann das letzte Angebot akzeptieren.
          </p>
        )}
      </CardFooter>
    </Card>
  );
}
