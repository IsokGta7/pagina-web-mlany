// A Perspective response is only a verdict when every requested attribute
// came back with a numeric score. Anything less is "unavailable", which
// applyTier2 turns into a hold for review, never an approval.

import { describe, it, expect } from 'vitest';
import { evaluatePerspectiveScores } from '../netlify/functions/submit-comment.js';

const ATTRS = ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'];

function scores(values: Record<string, number>) {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [k, { summaryScore: { value: v } }])
  );
}

function all(value: number, overrides: Record<string, number> = {}) {
  return scores({ ...Object.fromEntries(ATTRS.map((a) => [a, value])), ...overrides });
}

describe('evaluatePerspectiveScores', () => {
  it('approves when every attribute is present and below its threshold', () => {
    expect(evaluatePerspectiveScores(all(0.1))).toEqual({ flagged: false, flags: [] });
  });

  it('flags an attribute at or above its threshold', () => {
    const r = evaluatePerspectiveScores(all(0.1, { THREAT: 0.5 }));
    expect(r.flagged).toBe(true);
    expect(r.flags).toEqual(['perspective:threat:0.50']);
  });

  it('treats a response missing any attribute as unavailable, not clean', () => {
    const partial = all(0.1);
    delete partial.SEVERE_TOXICITY;
    expect(evaluatePerspectiveScores(partial)).toEqual({ skip: true });
  });

  it('treats a non-numeric score as unavailable', () => {
    const bad = all(0.1);
    bad.INSULT = { summaryScore: { value: 'n/a' as unknown as number } };
    expect(evaluatePerspectiveScores(bad)).toEqual({ skip: true });
  });

  it('treats a missing or malformed attributeScores object as unavailable', () => {
    expect(evaluatePerspectiveScores(undefined)).toEqual({ skip: true });
    expect(evaluatePerspectiveScores(null)).toEqual({ skip: true });
    expect(evaluatePerspectiveScores('x' as unknown as object)).toEqual({ skip: true });
  });
});
