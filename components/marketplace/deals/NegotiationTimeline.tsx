'use client';

import { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, FileText, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NegotiationActivity, NegotiationStatusEntry } from '@/types/negotiations';

interface NegotiationTimelineProps {
  activities: NegotiationActivity[];
  statusHistory: NegotiationStatusEntry[];
  expiresAt?: string | null;
  unreadCount?: number;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string | null;
  timestamp: string;
  icon: 'status' | 'activity' | 'sla-warning' | 'contract';
}

const ICON_MAP = {
  status: <FileText className="h-4 w-4 text-muted-foreground" />,
  activity: <Sparkles className="h-4 w-4 text-muted-foreground" />,
  'sla-warning': <ShieldAlert className="h-4 w-4 text-amber-500" />,
  contract: <UserCheck className="h-4 w-4 text-emerald-500" />,
};

function mapActivityToIcon(activity: NegotiationActivity): TimelineEvent['icon'] {
  if (activity.type === 'NEGOTIATION_SLA_WARNING' || activity.type === 'NEGOTIATION_SLA_BREACHED') {
    return 'sla-warning';
  }

  if (activity.type?.startsWith('CONTRACT_SIGNATURE')) {
    return 'contract';
  }

  return 'activity';
}

export function NegotiationTimeline({ activities, statusHistory, expiresAt, unreadCount = 0 }: NegotiationTimelineProps) {
  const events = useMemo(() => {
    const merged: TimelineEvent[] = [
      ...activities.map((activity) => ({
        id: `activity-${activity.id}`,
        title: activity.label,
        description: activity.description,
        timestamp: activity.occurredAt,
        icon: mapActivityToIcon(activity),
      })),
      ...statusHistory.map((status) => ({
        id: `status-${status.id}`,
        title: `Status: ${status.status}`,
        description: status.note,
        timestamp: status.createdAt,
        icon: 'status' as const,
      })),
    ];

    return merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activities, statusHistory]);

  const slaBadge = useMemo(() => {
    if (!expiresAt) {
      return null;
    }

    const expiresDate = new Date(expiresAt);
    const now = Date.now();
    const isExpired = expiresDate.getTime() < now;
    const distanceLabel = formatDistanceToNow(expiresDate, { addSuffix: true, locale: de });

    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5" /> SLA verletzt {distanceLabel}
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="flex items-center gap-1 text-amber-600">
        <Clock className="h-3.5 w-3.5" /> Läuft ab {distanceLabel}
      </Badge>
    );
  }, [expiresAt]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Verhandlungschronik</CardTitle>
          {unreadCount > 0 ? (
            <Badge variant="default" className="text-xs font-medium">
              {unreadCount} neu
            </Badge>
          ) : null}
        </div>
        {slaBadge}
      </CardHeader>
      <CardContent className="space-y-4">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Aktivitäten vorhanden.</p>
        ) : (
          <ol className="space-y-4">
            {events.map((event) => (
              <li key={event.id} className="flex gap-3">
                <div className="mt-0.5">{ICON_MAP[event.icon]}</div>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  {event.description ? (
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: de })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
