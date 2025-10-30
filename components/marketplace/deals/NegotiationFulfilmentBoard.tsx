'use client';

// meta: component=NegotiationFulfilmentBoard version=0.1 owner=operations scope=logistics

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

import type {
  NegotiationFulfilmentOrder,
  NegotiationSnapshot,
} from '@/types/negotiations';

interface FulfilmentActions {
  createFulfilmentOrder?: (body: Record<string, unknown>) => Promise<unknown>;
  updateFulfilmentOrder?: (orderId: string, body: Record<string, unknown>) => Promise<unknown>;
  recordFulfilmentMilestone?: (orderId: string, body: Record<string, unknown>) => Promise<unknown>;
  scheduleFulfilmentReminder?: (orderId: string, body: Record<string, unknown>) => Promise<unknown>;
}

interface NegotiationFulfilmentBoardProps {
  negotiation: NegotiationSnapshot;
  actions: FulfilmentActions | null;
  role: 'BUYER' | 'SELLER' | 'ADMIN' | null;
}

const STATUS_OPTIONS = [
  { value: 'SCHEDULING', label: 'In Planung' },
  { value: 'SCHEDULED', label: 'Geplant' },
  { value: 'IN_TRANSIT', label: 'Unterwegs' },
  { value: 'DELIVERED', label: 'Zugestellt' },
  { value: 'CANCELLED', label: 'Abgebrochen' },
];

const MILESTONE_OPTIONS = [
  { value: 'PICKUP_CONFIRMED', label: 'Abholung bestätigt' },
  { value: 'PICKED_UP', label: 'Abholung erfolgt' },
  { value: 'IN_TRANSIT', label: 'Unterwegs' },
  { value: 'OUT_FOR_DELIVERY', label: 'Auslieferung' },
  { value: 'DELIVERED', label: 'Zugestellt' },
  { value: 'CANCELLED', label: 'Storniert' },
];

const REMINDER_OPTIONS = [
  { value: 'PICKUP_WINDOW', label: 'Vor Abholung' },
  { value: 'DELIVERY_WINDOW', label: 'Vor Lieferung' },
  { value: 'SLA_BREACH', label: 'SLA-Eskalation' },
];

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }

  try {
    return format(typeof value === 'string' ? parseISO(value) : value, 'dd.MM.yyyy HH:mm');
  } catch {
    return value;
  }
}

function normalizeInput(value: string): string | null {
  return value.trim() === '' ? null : value;
}

interface FulfilmentOrderCardProps {
  order: NegotiationFulfilmentOrder;
  actions: FulfilmentActions | null;
  isParticipant: boolean;
}

function FulfilmentOrderCard({ order, actions, isParticipant }: FulfilmentOrderCardProps) {
  const [statusDraft, setStatusDraft] = useState(order.status ?? 'SCHEDULING');
  const [milestoneDraft, setMilestoneDraft] = useState<string>('PICKUP_CONFIRMED');
  const [reminderDraft, setReminderDraft] = useState<string>('PICKUP_WINDOW');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusUpdate = async () => {
    if (!actions?.updateFulfilmentOrder || !isParticipant) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    setLocalMessage(null);

    try {
      await actions.updateFulfilmentOrder(order.id, {
        status: statusDraft,
      });
      setLocalMessage('Status wurde aktualisiert.');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Status konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMilestone = async () => {
    if (!actions?.recordFulfilmentMilestone || !isParticipant) {
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    setLocalMessage(null);

    try {
      await actions.recordFulfilmentMilestone(order.id, {
        type: milestoneDraft,
      });
      setLocalMessage('Meilenstein wurde erfasst.');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Meilenstein konnte nicht gespeichert werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReminder = async () => {
    if (!actions?.scheduleFulfilmentReminder || !isParticipant) {
      return;
    }

    if (!reminderTime) {
      setLocalError('Bitte Zeitpunkt für Erinnerung wählen.');
      return;
    }

    setIsSubmitting(true);
    setLocalError(null);
    setLocalMessage(null);

    try {
      await actions.scheduleFulfilmentReminder(order.id, {
        type: reminderDraft,
        scheduledFor: new Date(reminderTime).toISOString(),
      });
      setLocalMessage('Erinnerung wurde geplant.');
      setReminderTime('');
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Erinnerung konnte nicht geplant werden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card key={order.id} className="space-y-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Fulfilment #{order.reference ?? order.id.slice(-6)}</CardTitle>
          <Badge variant="secondary">{order.status ?? 'UNBEKANNT'}</Badge>
        </div>
        <CardDescription>
          Abholung: {formatDate(order.pickupWindowStart)} · Lieferung: {formatDate(order.pickupWindowEnd)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 text-sm text-muted-foreground">
          {order.pickupLocation ? <p>Abholung: {order.pickupLocation}</p> : null}
          {order.deliveryLocation ? <p>Lieferung: {order.deliveryLocation}</p> : null}
          {order.carrierName ? (
            <p>
              Carrier: {order.carrierName}
              {order.carrierServiceLevel ? ` · ${order.carrierServiceLevel}` : ''}
            </p>
          ) : null}
          {order.trackingNumber ? <p>Tracking: {order.trackingNumber}</p> : null}
          {order.specialInstructions ? <p>Notizen: {order.specialInstructions}</p> : null}
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Meilensteine</h4>
          <div className="space-y-1 text-sm">
            {order.milestones.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Meilensteine.</p>
            ) : (
              order.milestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center justify-between text-xs">
                  <span>{milestone.type}</span>
                  <span>{formatDate(milestone.occurredAt)}</span>
                </div>
              ))
            )}
          </div>
          {isParticipant ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="sr-only" htmlFor={`milestone-${order.id}`}>
                  Meilenstein
                </Label>
                <Select value={milestoneDraft} onValueChange={setMilestoneDraft}>
                  <SelectTrigger id={`milestone-${order.id}`}>
                    <SelectValue placeholder="Meilenstein wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {MILESTONE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={handleMilestone} disabled={isSubmitting}>
                Meilenstein protokollieren
              </Button>
            </div>
          ) : null}
        </div>

        {isParticipant ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status & Erinnerungen</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Select value={statusDraft} onValueChange={setStatusDraft}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleStatusUpdate} disabled={isSubmitting}>
                  Status aktualisieren
                </Button>
              </div>
              <div className="space-y-2">
                <Select value={reminderDraft} onValueChange={setReminderDraft}>
                  <SelectTrigger>
                    <SelectValue placeholder="Erinnerungstyp" />
                  </SelectTrigger>
                  <SelectContent>
                    {REMINDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="datetime-local"
                  value={reminderTime}
                  onChange={(event) => setReminderTime(event.target.value)}
                />
                <Button variant="outline" onClick={handleReminder} disabled={isSubmitting}>
                  Erinnerung planen
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {localMessage ? <p className="text-sm text-green-600">{localMessage}</p> : null}
        {localError ? <p className="text-sm text-destructive">{localError}</p> : null}

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Geplante Erinnerungen</h4>
          {order.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Erinnerungen geplant.</p>
          ) : (
            <ul className="space-y-1 text-xs">
              {order.reminders.map((reminder) => (
                <li key={reminder.id}>
                  {reminder.type} · {formatDate(reminder.scheduledFor)}
                  {reminder.sentAt ? ` (versendet ${formatDate(reminder.sentAt)})` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function NegotiationFulfilmentBoard({ negotiation, actions, role }: NegotiationFulfilmentBoardProps) {
  const [createState, setCreateState] = useState({
    pickupWindowStart: '',
    pickupWindowEnd: '',
    pickupLocation: '',
    deliveryLocation: '',
    carrierName: '',
    carrierContact: '',
    carrierServiceLevel: '',
    specialInstructions: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isParticipant = role === 'BUYER' || role === 'SELLER' || role === 'ADMIN';

  const sortedOrders = useMemo(() => {
    return [...(negotiation.fulfilmentOrders ?? [])].sort((a, b) => {
      const startA = a.pickupWindowStart ? Date.parse(a.pickupWindowStart) : 0;
      const startB = b.pickupWindowStart ? Date.parse(b.pickupWindowStart) : 0;
      return startA - startB;
    });
  }, [negotiation.fulfilmentOrders]);

  const handleCreate = async () => {
    if (!actions?.createFulfilmentOrder || !isParticipant) {
      return;
    }

    if (!createState.pickupWindowStart || !createState.pickupWindowEnd) {
      setCreateError('Bitte Abholfenster angeben.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setFeedback(null);

    try {
      await actions.createFulfilmentOrder({
        pickupWindowStart: new Date(createState.pickupWindowStart).toISOString(),
        pickupWindowEnd: new Date(createState.pickupWindowEnd).toISOString(),
        pickupLocation: normalizeInput(createState.pickupLocation),
        deliveryLocation: normalizeInput(createState.deliveryLocation),
        carrierName: normalizeInput(createState.carrierName),
        carrierContact: normalizeInput(createState.carrierContact),
        carrierServiceLevel: normalizeInput(createState.carrierServiceLevel),
        specialInstructions: normalizeInput(createState.specialInstructions),
      });
      setFeedback('Fulfilment-Auftrag wurde angelegt.');
      setCreateState({
        pickupWindowStart: '',
        pickupWindowEnd: '',
        pickupLocation: '',
        deliveryLocation: '',
        carrierName: '',
        carrierContact: '',
        carrierServiceLevel: '',
        specialInstructions: '',
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Auftrag konnte nicht erstellt werden.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h3 className="text-lg font-semibold">Fulfilment & Logistik</h3>
        <p className="text-sm text-muted-foreground">
          Planen Sie Abholung und Lieferung, verfolgen Sie den Fortschritt und koordinieren Sie Erinnerungen für alle
          Beteiligten.
        </p>
      </header>

      {feedback ? <p className="text-sm text-green-600">{feedback}</p> : null}
      {createError ? <p className="text-sm text-destructive">{createError}</p> : null}

      {isParticipant ? (
        <Card>
          <CardHeader>
            <CardTitle>Neuen Fulfilment-Auftrag planen</CardTitle>
            <CardDescription>Koordinieren Sie Abholung und Lieferung mit Carrier-Details.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pickup-start">Abholfenster (Start)</Label>
              <Input
                id="pickup-start"
                type="datetime-local"
                value={createState.pickupWindowStart}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, pickupWindowStart: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-end">Abholfenster (Ende)</Label>
              <Input
                id="pickup-end"
                type="datetime-local"
                value={createState.pickupWindowEnd}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, pickupWindowEnd: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pickup-location">Abholort</Label>
              <Input
                id="pickup-location"
                value={createState.pickupLocation}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, pickupLocation: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-location">Lieferadresse</Label>
              <Input
                id="delivery-location"
                value={createState.deliveryLocation}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, deliveryLocation: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier-name">Carrier</Label>
              <Input
                id="carrier-name"
                value={createState.carrierName}
                onChange={(event) => setCreateState((state) => ({ ...state, carrierName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier-service">Service-Level</Label>
              <Input
                id="carrier-service"
                value={createState.carrierServiceLevel}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, carrierServiceLevel: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier-contact">Carrier-Kontakt</Label>
              <Input
                id="carrier-contact"
                value={createState.carrierContact}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, carrierContact: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="instructions">Besondere Hinweise</Label>
              <Textarea
                id="instructions"
                value={createState.specialInstructions}
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, specialInstructions: event.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleCreate} disabled={isCreating}>
                Fulfilment-Auftrag anlegen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedOrders.length === 0 ? (
          <Card className="lg:col-span-2">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Noch keine Fulfilment-Aufträge geplant.
            </CardContent>
          </Card>
        ) : (
          sortedOrders.map((order) => (
            <FulfilmentOrderCard
              key={order.id}
              order={order}
              actions={actions}
              isParticipant={isParticipant}
            />
          ))
        )}
      </div>
    </section>
  );
}
