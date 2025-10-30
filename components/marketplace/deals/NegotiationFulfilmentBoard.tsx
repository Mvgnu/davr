'use client';

// meta: component=NegotiationFulfilmentBoard version=0.2 owner=operations scope=logistics

import Link from 'next/link';
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
  canMutate: boolean;
}

function FulfilmentOrderCard({ order, actions, canMutate }: FulfilmentOrderCardProps) {
  const [statusDraft, setStatusDraft] = useState(order.status ?? 'SCHEDULING');
  const [milestoneDraft, setMilestoneDraft] = useState<string>('PICKUP_CONFIRMED');
  const [reminderDraft, setReminderDraft] = useState<string>('PICKUP_WINDOW');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusUpdate = async () => {
    if (!actions?.updateFulfilmentOrder || !canMutate) {
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
    if (!actions?.recordFulfilmentMilestone || !canMutate) {
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
    if (!actions?.scheduleFulfilmentReminder || !canMutate) {
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
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{order.status ?? 'UNBEKANNT'}</Badge>
            {order.carrierSyncStatus ? (
              <Badge variant="outline">Sync: {order.carrierSyncStatus}</Badge>
            ) : null}
          </div>
        </div>
        <CardDescription>
          Abholung: {formatDate(order.pickupWindowStart)} · Lieferung: {formatDate(order.pickupWindowEnd)}
        </CardDescription>
        {order.carrierCode ? (
          <p className="text-xs text-muted-foreground">
            Carrier-Code: {order.carrierCode}
            {order.lastCarrierSyncAt ? ` · Sync: ${formatDate(order.lastCarrierSyncAt)}` : ''}
          </p>
        ) : null}
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
          {canMutate ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label className="sr-only" htmlFor={`milestone-${order.id}`}>
                  Meilenstein
                </Label>
                <Select value={milestoneDraft} onValueChange={setMilestoneDraft} disabled={isSubmitting}>
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

        {canMutate ? (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Status & Erinnerungen</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Select value={statusDraft} onValueChange={setStatusDraft} disabled={isSubmitting}>
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
                <Select value={reminderDraft} onValueChange={setReminderDraft} disabled={isSubmitting}>
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
                  disabled={isSubmitting}
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
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Carrier-Tracking</h4>
          {order.carrierManifest ? (
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">
                Tracking-Referenz: {order.carrierManifest.trackingReference ?? '—'} · Status:{' '}
                {order.carrierManifest.pollingStatus}
              </p>
              <p className="text-muted-foreground">
                Letzte Synchronisierung:{' '}
                {formatDate(order.carrierManifest.lastSyncedAt ?? order.lastCarrierSyncAt)}
              </p>
              {order.carrierManifest.trackingEvents.length === 0 ? (
                <p className="text-muted-foreground">Noch keine Ereignisse vom Carrier.</p>
              ) : (
                <ul className="space-y-1">
                  {order.carrierManifest.trackingEvents.map((event) => (
                    <li key={event.id} className="flex items-center justify-between">
                      <span>{event.status}</span>
                      <span>{formatDate(event.eventTime)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Noch kein Carrier-Manifest registriert. Tragen Sie einen Carrier-Code ein, um Tracking zu aktivieren.
            </p>
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
    carrierCode: '',
    carrierName: '',
    carrierContact: '',
    carrierServiceLevel: '',
    specialInstructions: '',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isParticipant = role === 'BUYER' || role === 'SELLER' || role === 'ADMIN';
  const premiumViewer = negotiation.premium?.viewer ?? null;
  const paymentFailed = premiumViewer?.dunningState === 'PAYMENT_FAILED';
  const isInGrace = premiumViewer?.isInGracePeriod ?? false;
  const paymentLocked = paymentFailed && !isInGrace;
  const seatLocked = premiumViewer?.isSeatCapacityExceeded ?? false;
  const conciergeActive = premiumViewer?.hasConciergeSla ?? false;
  const pastDue = premiumViewer?.dunningState === 'PAST_DUE';
  const entitlementActive = conciergeActive && !paymentLocked && !seatLocked;
  const mutationEnabled = Boolean(actions) && entitlementActive && isParticipant;
  const upgradePrompt = premiumViewer?.upgradePrompt;

  let gatingVariant: 'destructive' | 'warning' | 'info' | null = null;
  let gatingTitle: string | null = null;
  let gatingDescription: string | null = null;
  let gatingCtaLabel: string | null = null;

  if (paymentLocked) {
    gatingVariant = 'destructive';
    gatingTitle = 'Fulfilment gesperrt – Zahlung fehlgeschlagen';
    gatingDescription =
      'Die letzte Premium-Zahlung ist fehlgeschlagen. Aktualisieren Sie die Zahlungsmethode, um Fulfilment-Automation fortzusetzen.';
    gatingCtaLabel = upgradePrompt?.cta ?? 'Zahlung aktualisieren';
  } else if (seatLocked) {
    gatingVariant = 'warning';
    const seatSummary =
      premiumViewer?.seatCapacity != null && premiumViewer?.seatsInUse != null
        ? `${premiumViewer.seatsInUse} von ${premiumViewer.seatCapacity} Sitzplätzen belegt.`
        : 'Bitte Sitzplatzkontingent im Admin-Center prüfen.';
    gatingTitle = 'Premium-Sitzplatzlimit erreicht';
    gatingDescription = `${seatSummary} Fulfilment-Kontrollen bleiben schreibgeschützt, bis Plätze freigegeben werden.`;
    gatingCtaLabel = 'Sitzplätze verwalten';
  } else if (!conciergeActive) {
    gatingVariant = 'info';
    gatingTitle = 'Concierge-Fulfilment erfordert Premium';
    gatingDescription =
      upgradePrompt?.description ??
      'Concierge-Funktionen (Carrier-Steuerung, SLA-Automation) stehen nur Premium-Workspaces zur Verfügung.';
    gatingCtaLabel = upgradePrompt?.cta ?? 'Upgrade starten';
  } else if (pastDue) {
    gatingVariant = 'warning';
    gatingTitle = 'Zahlung überfällig – bitte prüfen';
    gatingDescription =
      'Die Premium-Rechnung ist überfällig. Fulfilment bleibt aktiv, doch bitte Zahlung zeitnah aktualisieren, um Sperren zu vermeiden.';
    gatingCtaLabel = upgradePrompt?.cta ?? 'Abrechnung prüfen';
  }

  const gatingCardClass =
    gatingVariant === 'destructive'
      ? 'border-destructive/50 bg-destructive/10'
      : gatingVariant === 'warning'
      ? 'border-amber-400/60 bg-amber-50'
      : 'border-primary/40 bg-primary/5';

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

    if (!entitlementActive) {
      setCreateError('Fulfilment-Aktionen sind derzeit aufgrund von Premium-Einschränkungen gesperrt.');
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
        carrierCode: normalizeInput(createState.carrierCode)?.toUpperCase() ?? null,
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
        carrierCode: '',
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

      {gatingVariant ? (
        <Card className={`${gatingCardClass}`}>
          <CardHeader>
            <CardTitle>{gatingTitle}</CardTitle>
            <CardDescription>{gatingDescription}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              {upgradePrompt?.headline ?? 'Premium-Abrechnung im Admin-Center verwalten.'}
            </span>
            {gatingCtaLabel ? (
              <Link
                href="/admin/deals/operations/upgrade"
                className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${
                  gatingVariant === 'destructive'
                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                    : gatingVariant === 'warning'
                    ? 'bg-amber-500 text-amber-50 hover:bg-amber-600'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90'
                }`}
              >
                {gatingCtaLabel}
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier-code">Carrier-Code</Label>
              <Input
                id="carrier-code"
                value={createState.carrierCode}
                placeholder="z. B. MOCK_EXPRESS"
                onChange={(event) =>
                  setCreateState((state) => ({ ...state, carrierCode: event.target.value }))
                }
                disabled={!entitlementActive || isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carrier-name">Carrier</Label>
              <Input
                id="carrier-name"
                value={createState.carrierName}
                onChange={(event) => setCreateState((state) => ({ ...state, carrierName: event.target.value }))}
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
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
                disabled={!entitlementActive || isCreating}
              />
            </div>
            <div className="sm:col-span-2">
              <Button onClick={handleCreate} disabled={!entitlementActive || isCreating}>
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
              canMutate={mutationEnabled}
            />
          ))
        )}
      </div>
    </section>
  );
}
