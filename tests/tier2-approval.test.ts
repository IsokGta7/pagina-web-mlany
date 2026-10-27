// Tests for how the Tier 2 (AI) result decides whether a comment goes live
// without a moderator. The rule: auto-approval needs both a clean Tier 1 and a
// Tier 2 check that actually ran and found nothing. Anything else, including
// Tier 2 not being set up at all, sends the comment to review.

import { describe, it, expect } from 'vitest';
import { applyTier2 } from '../netlify/functions/submit-comment.js';

describe('applyTier2', () => {
  it('approves a clean comment that Tier 2 checked and cleared', () => {
    expect(applyTier2([], { flagged: false, flags: [] })).toEqual({ approved: true, flags: [] });
  });

  it('sends a clean comment to review when Tier 2 is not configured', () => {
    expect(applyTier2([], { configured: false })).toEqual({
      approved: false,
      flags: ['ai-moderation-not-configured'],
    });
  });

  it('treats a missing Tier 2 result like an unconfigured one', () => {
    expect(applyTier2([], null)).toEqual({
      approved: false,
      flags: ['ai-moderation-not-configured'],
    });
  });

  it('sends a clean comment to review when the Tier 2 call failed', () => {
    expect(applyTier2([], { skip: true })).toEqual({
      approved: false,
      flags: ['ai-moderation-unavailable'],
    });
  });

  it('keeps the Tier 2 reasons when it flags the comment', () => {
    expect(applyTier2([], { flagged: true, flags: ['openai:harassment'] })).toEqual({
      approved: false,
      flags: ['openai:harassment'],
    });
  });

  it('keeps Tier 1 flags ahead of any Tier 2 reason', () => {
    expect(applyTier2(['contains-1-link'], { configured: false }).flags).toEqual([
      'contains-1-link',
      'ai-moderation-not-configured',
    ]);
    expect(applyTier2(['all-caps'], { flagged: true, flags: ['perspective:insult:0.80'] }).flags).toEqual([
      'all-caps',
      'perspective:insult:0.80',
    ]);
  });

  it('does not approve a Tier 1 flagged comment even when Tier 2 cleared it', () => {
    expect(applyTier2(['profanity:mierda'], { flagged: false, flags: [] })).toEqual({
      approved: false,
      flags: ['profanity:mierda'],
    });
  });

  it('does not mutate the Tier 1 flags it was given', () => {
    const t1 = ['all-caps'];
    const out = applyTier2(t1, { configured: false });
    out.flags.push('cached-moderation');
    expect(t1).toEqual(['all-caps']);
  });
});
