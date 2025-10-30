import {
  DealDisputeCategory,
  DealDisputeSeverity,
  DealDisputeStatus,
  EscrowStatus,
} from '@prisma/client';

/**
 * meta: module=deal-disputes owner=operations scope=admin version=0.1
 * Provides lightweight recommendation scaffolding so the dispute cockpit can
 * surface guided actions, templated communications and compliance checkpoints
 * without hard-coding heuristics inside UI components.
 */
export interface DisputeGuidanceContext {
  id: string;
  negotiationId: string;
  status: DealDisputeStatus;
  severity: DealDisputeSeverity;
  category: DealDisputeCategory;
  raisedAt: Date;
  slaDueAt: Date | null;
  slaBreachedAt: Date | null;
  resolvedAt: Date | null;
  acknowledgedAt: Date | null;
  escrowStatus: EscrowStatus | null;
  holdAmount: number;
  counterProposalAmount: number | null;
  resolutionPayoutAmount: number | null;
  missingEvidence: boolean;
  reopenedCount: number;
  analytics: {
    openHours: number;
    hoursUntilBreach: number | null;
    hoursSinceBreach: number | null;
    hoursToResolution: number | null;
  };
}

export interface DisputeRecommendationAction {
  label: string;
  type: 'workflow' | 'status' | 'communication';
  href?: string;
  targetStatus?: DealDisputeStatus;
  templateId?: string;
}

export interface DisputeRecommendation {
  id: string;
  title: string;
  rationale: string;
  priority: 'low' | 'medium' | 'high';
  actions: DisputeRecommendationAction[];
}

export interface DisputeCommunicationTemplate {
  id: string;
  label: string;
  audience: 'buyer' | 'seller' | 'both';
  subject: string;
  body: string;
  tone: 'neutral' | 'firm' | 'collaborative';
}

export interface DisputeComplianceChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  hint?: string;
}

export interface DealDisputeGuidance {
  recommendations: DisputeRecommendation[];
  communications: DisputeCommunicationTemplate[];
  checklist: DisputeComplianceChecklistItem[];
}

const HOURS_BEFORE_ESCALATION_PROMPT = 6;

function buildEscalationRecommendation(context: DisputeGuidanceContext): DisputeRecommendation | null {
  if (context.status === DealDisputeStatus.ESCALATED || context.status === DealDisputeStatus.RESOLVED) {
    return null;
  }

  if (context.severity === DealDisputeSeverity.LOW && !context.analytics.hoursSinceBreach) {
    return null;
  }

  const overdue = context.analytics.hoursSinceBreach && context.analytics.hoursSinceBreach > 0;
  const highSeverity = context.severity === DealDisputeSeverity.HIGH || context.severity === DealDisputeSeverity.CRITICAL;
  const escalationNeeded = overdue || highSeverity;

  if (!escalationNeeded) {
    return null;
  }

  const rationale = overdue
    ? 'SLA wurde verletzt – Eskalation an Senior-Reviewer empfohlen.'
    : 'Schweregrad Hoch/Kritisch – Eskalation vorbereiten, um Rückstände zu vermeiden.';

  return {
    id: 'escalate-senior-review',
    title: 'Eskalation vorbereiten',
    rationale,
    priority: overdue ? 'high' : 'medium',
    actions: [
      {
        label: 'Status auf Eskalation setzen',
        type: 'status',
        targetStatus: DealDisputeStatus.ESCALATED,
      },
      {
        label: 'Templated E-Mail an Buyer & Seller',
        type: 'communication',
        templateId: 'breach-notice',
      },
    ],
  };
}

function buildEvidenceRecommendation(context: DisputeGuidanceContext): DisputeRecommendation | null {
  if (!context.missingEvidence || context.status === DealDisputeStatus.RESOLVED) {
    return null;
  }

  return {
    id: 'request-evidence',
    title: 'Weitere Evidenzen anfordern',
    rationale:
      'Für eine fundierte Entscheidung fehlen aktuelle Nachweise. Fordere Bilder, Lieferpapiere oder Chatverläufe an.',
    priority: 'medium',
    actions: [
      {
        label: 'Status auf Rückfrage setzen',
        type: 'status',
        targetStatus: DealDisputeStatus.AWAITING_PARTIES,
      },
      {
        label: 'Nachricht an Parteien verfassen',
        type: 'communication',
        templateId: 'evidence-request',
      },
    ],
  };
}

function buildSettlementRecommendation(context: DisputeGuidanceContext): DisputeRecommendation | null {
  if (context.status !== DealDisputeStatus.UNDER_REVIEW && context.status !== DealDisputeStatus.AWAITING_PARTIES) {
    return null;
  }

  if (context.counterProposalAmount == null && context.resolutionPayoutAmount == null) {
    return null;
  }

  return {
    id: 'prepare-settlement',
    title: 'Vergleichsabschluss vorbereiten',
    rationale:
      'Es liegen bereits finanzielle Vergleichsdaten vor. Bereite die finale Auszahlung oder Rückerstattung vor und stimme sie mit Compliance ab.',
    priority: 'medium',
    actions: [
      {
        label: 'Auszahlungs-Workflow öffnen',
        type: 'workflow',
        href: `/app/admin/deals/operations/disputes/${context.id}/settlement`,
      },
      {
        label: 'Abschlussbenachrichtigung entwerfen',
        type: 'communication',
        templateId: 'resolution-summary',
      },
    ],
  };
}

function buildGraceWindowRecommendation(context: DisputeGuidanceContext): DisputeRecommendation | null {
  if (context.status === DealDisputeStatus.ESCALATED || context.status === DealDisputeStatus.RESOLVED) {
    return null;
  }

  if (context.analytics.hoursUntilBreach == null) {
    return null;
  }

  if (context.analytics.hoursUntilBreach > HOURS_BEFORE_ESCALATION_PROMPT) {
    return null;
  }

  return {
    id: 'sla-grace-window',
    title: 'SLA-Fälligkeitscheck',
    rationale:
      'Die SLA-Fälligkeit wird in Kürze erreicht. Stelle sicher, dass ein Aktionsplan vorliegt (Kontaktaufnahme, Eskalation oder Teilentscheidung).',
    priority: context.analytics.hoursUntilBreach <= 1 ? 'high' : 'medium',
    actions: [
      {
        label: 'Kurzupdate an Parteien senden',
        type: 'communication',
        templateId: 'sla-update',
      },
      {
        label: 'Review-Checklist durchgehen',
        type: 'workflow',
        href: '#dispute-compliance-checklist',
      },
    ],
  };
}

function buildComplianceChecklist(context: DisputeGuidanceContext): DisputeComplianceChecklistItem[] {
  return [
    {
      id: 'verify-escrow-status',
      label: 'Treuhandstatus geprüft (DISPUTED oder HOLD)',
      completed: context.escrowStatus === EscrowStatus.DISPUTED || context.holdAmount > 0,
      hint: 'Stelle sicher, dass Sperren dokumentiert sind, bevor Entscheidungen getroffen werden.',
    },
    {
      id: 'evidence-updated',
      label: 'Aktuelle Evidenzen in den letzten 24h eingegangen',
      completed: !context.missingEvidence,
      hint: 'Erinnere Parteien, falls keine neuen Belege vorliegen.',
    },
    {
      id: 'communication-logged',
      label: 'Letzte Kommunikation ist im System protokolliert',
      completed: context.acknowledgedAt != null,
      hint: 'Notiere Telefonate oder externe Kommunikation im Dispute-Log.',
    },
    {
      id: 'resolution-metrics',
      label: 'Zeiten für Reporting aktualisiert',
      completed: context.resolvedAt != null || context.status !== DealDisputeStatus.RESOLVED,
      hint: 'Finale Entscheidungen sollten innerhalb von 4h dokumentiert werden.',
    },
  ];
}

function buildCommunicationTemplates(context: DisputeGuidanceContext): DisputeCommunicationTemplate[] {
  const templates: DisputeCommunicationTemplate[] = [
    {
      id: 'evidence-request',
      label: 'Nachweise anfordern',
      audience: 'both',
      subject: 'Bitte reiche zusätzliche Nachweise zum Disput ein',
      body: `Hallo,\n\nwir benötigen weitere Nachweise (Fotos, Lieferscheine oder Gesprächsprotokolle), um den Disput "${context.id}" abschließen zu können. Bitte lade die Dokumente innerhalb der nächsten 12 Stunden hoch.\n\nVielen Dank!\nOperations-Team`,
      tone: 'collaborative',
    },
    {
      id: 'breach-notice',
      label: 'SLA-Verletzung kommunizieren',
      audience: 'both',
      subject: 'Update zum Disput – Eskalation eingeleitet',
      body: `Hallo,\n\nwir haben den Disput "${context.id}" eskaliert, da die vereinbarte Bearbeitungszeit überschritten wurde. Ein Senior-Spezialist übernimmt und meldet sich mit den nächsten Schritten.\n\nBeste Grüße\nOperations-Team`,
      tone: 'firm',
    },
    {
      id: 'sla-update',
      label: 'SLA-Reminder',
      audience: 'both',
      subject: 'Disput-Update – Bitte bereithalten',
      body: `Hallo,\n\nwir nähern uns der SLA-Fälligkeit für Disput "${context.id}". Bitte halte relevante Informationen bereit, damit wir schnell entscheiden können.\n\nDanke\nOperations-Team`,
      tone: 'neutral',
    },
    {
      id: 'resolution-summary',
      label: 'Abschlussnachricht',
      audience: 'both',
      subject: 'Abschluss zum Disput',
      body: `Hallo,\n\nwir haben den Disput "${context.id}" abgeschlossen. Eine Übersicht der Entscheidung findest du im Portal. Falls Rückfragen bestehen, antworte bitte direkt auf diese Nachricht.\n\nFreundliche Grüße\nOperations-Team`,
      tone: 'collaborative',
    },
  ];

  if (context.severity === DealDisputeSeverity.CRITICAL) {
    templates.push({
      id: 'vip-concierge-escalation',
      label: 'Concierge-Eskalation informieren',
      audience: 'buyer',
      subject: 'Concierge-Update zum Disput',
      body: `Hallo,\n\nwir haben deinen Disput "${context.id}" mit höchster Priorität markiert. Unser Concierge-Team meldet sich telefonisch für die nächsten Schritte.\n\nViele Grüße\nConcierge-Team`,
      tone: 'collaborative',
    });
  }

  return templates;
}

export function buildDealDisputeGuidance(context: DisputeGuidanceContext): DealDisputeGuidance {
  const recommendations = [
    buildEscalationRecommendation(context),
    buildEvidenceRecommendation(context),
    buildSettlementRecommendation(context),
    buildGraceWindowRecommendation(context),
  ].filter((value): value is DisputeRecommendation => Boolean(value));

  const communications = buildCommunicationTemplates(context);
  const checklist = buildComplianceChecklist(context);

  return {
    recommendations,
    communications,
    checklist,
  };
}
