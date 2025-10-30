/**
 * meta: module=contract-diff owner=platform stage=beta
 */

export type ClauseDiffType = 'added' | 'removed' | 'unchanged' | 'modified';

export interface InlineDiffSegment {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
}

export interface ClauseDiffSegment {
  type: ClauseDiffType;
  baseIndex: number | null;
  targetIndex: number | null;
  baseClause: string | null;
  targetClause: string | null;
  inlineDiff?: InlineDiffSegment[];
}

const CLAUSE_SPLIT_REGEX = /\n{2,}|\r?\n(?=(?:\d+\.|[A-Za-z]\)|[IVXLC]+\.|•|-))/u;

function normalizeClause(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function tokenizeClauses(input: string): string[] {
  if (!input.trim()) {
    return [];
  }

  const clauses = input
    .split(CLAUSE_SPLIT_REGEX)
    .map((clause) => clause.trim())
    .filter((clause) => clause.length > 0);

  if (clauses.length === 0) {
    return [input.trim()];
  }

  return clauses;
}

function buildLcsMatrix(a: string[], b: string[]): number[][] {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }

  return matrix;
}

function backtrackDiff(
  matrix: number[][],
  baseClauses: string[],
  targetClauses: string[],
  normalizedBase: string[],
  normalizedTarget: string[]
) {
  const result: Array<{ type: 'added' | 'removed' | 'unchanged'; value: string; baseIndex: number | null; targetIndex: number | null }> = [];

  let i = baseClauses.length;
  let j = targetClauses.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizedBase[i - 1] === normalizedTarget[j - 1]) {
      result.unshift({
        type: 'unchanged',
        value: targetClauses[j - 1],
        baseIndex: i - 1,
        targetIndex: j - 1,
      });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({ type: 'added', value: targetClauses[j - 1], baseIndex: null, targetIndex: j - 1 });
      j -= 1;
    } else if (i > 0) {
      result.unshift({ type: 'removed', value: baseClauses[i - 1], baseIndex: i - 1, targetIndex: null });
      i -= 1;
    }
  }

  return result;
}

function tokenizeWords(text: string): string[] {
  return text
    .split(/(\s+|[,.;:(){}\[\]])/u)
    .filter((token) => token.length > 0);
}

function computeInlineDiff(baseClause: string, targetClause: string): InlineDiffSegment[] {
  const baseTokens = tokenizeWords(baseClause);
  const targetTokens = tokenizeWords(targetClause);
  const normalizedBase = baseTokens.map((token) => token);
  const normalizedTarget = targetTokens.map((token) => token);
  const matrix = buildLcsMatrix(normalizedBase, normalizedTarget);

  const result: InlineDiffSegment[] = [];

  let i = baseTokens.length;
  let j = targetTokens.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normalizedBase[i - 1] === normalizedTarget[j - 1]) {
      result.unshift({ type: 'unchanged', text: targetTokens[j - 1] });
      i -= 1;
      j -= 1;
    } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
      result.unshift({ type: 'added', text: targetTokens[j - 1] });
      j -= 1;
    } else if (i > 0) {
      result.unshift({ type: 'removed', text: baseTokens[i - 1] });
      i -= 1;
    }
  }

  return mergeInlineTokens(result);
}

function mergeInlineTokens(segments: InlineDiffSegment[]): InlineDiffSegment[] {
  return segments.reduce<InlineDiffSegment[]>((accumulator, segment) => {
    const last = accumulator.at(-1);
    if (!last || last.type !== segment.type) {
      accumulator.push({ ...segment });
      return accumulator;
    }

    last.text += segment.text;
    return accumulator;
  }, []);
}

export function computeClauseDiff(baseText: string, targetText: string): ClauseDiffSegment[] {
  const baseClauses = tokenizeClauses(baseText);
  const targetClauses = tokenizeClauses(targetText);
  const normalizedBase = baseClauses.map(normalizeClause);
  const normalizedTarget = targetClauses.map(normalizeClause);
  const matrix = buildLcsMatrix(normalizedBase, normalizedTarget);
  const rawDiff = backtrackDiff(matrix, baseClauses, targetClauses, normalizedBase, normalizedTarget);

  const segments: ClauseDiffSegment[] = [];

  for (let index = 0; index < rawDiff.length; index += 1) {
    const entry = rawDiff[index];
    if (entry.type === 'unchanged') {
      segments.push({
        type: 'unchanged',
        baseIndex: entry.baseIndex,
        targetIndex: entry.targetIndex,
        baseClause: entry.value,
        targetClause: entry.value,
      });
      continue;
    }

    const next = rawDiff[index + 1];
    if (entry.type === 'removed' && next?.type === 'added') {
      segments.push({
        type: 'modified',
        baseIndex: entry.baseIndex,
        targetIndex: next.targetIndex,
        baseClause: entry.value,
        targetClause: next.value,
        inlineDiff: computeInlineDiff(entry.value, next.value),
      });
      index += 1;
      continue;
    }

    if (entry.type === 'added') {
      segments.push({
        type: 'added',
        baseIndex: entry.baseIndex,
        targetIndex: entry.targetIndex,
        baseClause: null,
        targetClause: entry.value,
      });
    } else {
      segments.push({
        type: 'removed',
        baseIndex: entry.baseIndex,
        targetIndex: entry.targetIndex,
        baseClause: entry.value,
        targetClause: null,
      });
    }
  }

  return segments;
}

export interface ClauseDiffSummary {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
}

export function summarizeClauseDiff(diff: ClauseDiffSegment[]): ClauseDiffSummary {
  return diff.reduce<ClauseDiffSummary>(
    (totals, segment) => {
      if (segment.type === 'added') {
        totals.added += 1;
      } else if (segment.type === 'removed') {
        totals.removed += 1;
      } else if (segment.type === 'modified') {
        totals.modified += 1;
      } else {
        totals.unchanged += 1;
      }

      return totals;
    },
    { added: 0, removed: 0, modified: 0, unchanged: 0 }
  );
}

export function buildDiffFingerprint(diff: ClauseDiffSegment[]): string {
  const parts = diff.map((segment) => `${segment.type}:${normalizeClause(segment.targetClause ?? segment.baseClause ?? '')}`);
  return parts.join('|');
}

export function computeNegotiationContractFingerprint(body: string, summary?: string | null): string {
  const normalizedBody = normalizeClause(body);
  const normalizedSummary = summary ? normalizeClause(summary) : '';
  return `${normalizedSummary}::${normalizedBody}`;
}
