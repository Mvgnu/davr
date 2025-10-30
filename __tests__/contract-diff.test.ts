import { buildDiffFingerprint, computeClauseDiff, computeNegotiationContractFingerprint, summarizeClauseDiff } from '@/lib/contracts/diff';

describe('contract diff utilities', () => {
  it('computes clause diff with modified sections', () => {
    const base = `1. Scope\n\nThe buyer agrees to purchase widgets.\n\n2. Payment\n\nPayment due within 30 days.`;
    const target = `1. Scope\n\nThe buyer agrees to purchase premium widgets.\n\n2. Payment\n\nPayment due within 15 days.\n\n3. Warranty\n\nSeller provides a 90-day warranty.`;

    const diff = computeClauseDiff(base, target);
    const summary = summarizeClauseDiff(diff);

    expect(summary).toEqual({ added: 2, removed: 0, modified: 2, unchanged: 2 });
    const fingerprint = buildDiffFingerprint(diff);
    expect(fingerprint).toContain('modified');
    expect(fingerprint).toContain('Warranty');
  });

  it('returns stable fingerprint for identical clauses', () => {
    const base = '1. Scope\n\nWidgets shall be delivered weekly.';
    const diff = computeClauseDiff(base, base);
    expect(summarizeClauseDiff(diff)).toEqual({ added: 0, removed: 0, modified: 0, unchanged: 2 });
    expect(buildDiffFingerprint(diff)).toBe('unchanged:1. Scope|unchanged:Widgets shall be delivered weekly.');
  });

  it('builds negotiation contract fingerprint from summary and body', () => {
    const fingerprint = computeNegotiationContractFingerprint('Widgets delivered weekly', 'Summary');
    const fingerprintTwo = computeNegotiationContractFingerprint('Widgets delivered weekly', 'Summary');
    expect(fingerprint).toBe(fingerprintTwo);
    expect(fingerprint).toContain('Summary');
  });
});
