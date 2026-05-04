// Tests for the Tier 1 (local, no-API) moderation pipeline.
// Like the profanity tests, these assert what the filter SHOULD do, not
// whatever the implementation happens to return today.

import { describe, it, expect } from 'vitest';
import { tier1, sanitize, POST_SLUG_RX, MAX_NAME, MAX_CONTENT } from '../netlify/functions/_validation.js';

describe('sanitize', () => {
  it('strips HTML tags', () => {
    expect(sanitize('<script>alert(1)</script>hi')).toBe('alert(1)hi');
    expect(sanitize('<b>bold</b> text')).toBe('bold text');
  });

  it('trims whitespace', () => {
    expect(sanitize('   hello   ')).toBe('hello');
  });

  it('coerces non-strings', () => {
    expect(sanitize(123)).toBe('123');
    expect(sanitize(null)).toBe('null');
  });
});

describe('POST_SLUG_RX', () => {
  it('accepts kebab-case ids matching content collection slugs', () => {
    expect(POST_SLUG_RX.test('computacion-cuantica')).toBe(true);
    expect(POST_SLUG_RX.test('articulo-de-prueba')).toBe(true);
    expect(POST_SLUG_RX.test('a1b2-c3')).toBe(true);
  });

  it('rejects path traversal and arbitrary input', () => {
    expect(POST_SLUG_RX.test('../etc/passwd')).toBe(false);
    expect(POST_SLUG_RX.test('foo/bar')).toBe(false);
    expect(POST_SLUG_RX.test('foo bar')).toBe(false);
    expect(POST_SLUG_RX.test('')).toBe(false);
    expect(POST_SLUG_RX.test('foo.bar')).toBe(false);
    expect(POST_SLUG_RX.test('foo;rm -rf')).toBe(false);
  });
});

describe('tier1 — hard rejections', () => {
  it('rejects empty name', () => {
    expect(tier1('a perfectly fine comment', '').reject).toBe('Author name required');
  });

  it('rejects name longer than MAX_NAME', () => {
    expect(tier1('hello', 'x'.repeat(MAX_NAME + 1)).reject).toMatch(/name too long/i);
  });

  it('rejects empty / single-char content', () => {
    expect(tier1('', 'name').reject).toBe('Comment too short');
    expect(tier1('a', 'name').reject).toBe('Comment too short');
  });

  it('rejects content above MAX_CONTENT', () => {
    expect(tier1('x'.repeat(MAX_CONTENT + 1), 'name').reject).toBe('Comment too long');
  });

  it('rejects commercial spam keywords', () => {
    expect(tier1('Buy viagra now from our store', 'name').reject).toMatch(/spam/i);
    expect(tier1('Best casino online', 'name').reject).toMatch(/spam/i);
    expect(tier1('Make money fast with bitcoin profit', 'name').reject).toMatch(/spam/i);
  });

  it('rejects spam keyword in author name as well', () => {
    expect(tier1('hello', 'CASINO BOT').reject).toMatch(/spam/i);
  });

  it('rejects 7+ repeated characters', () => {
    expect(tier1('aaaaaaaa what is this', 'name').reject).toMatch(/repeated/i);
    expect(tier1('!!!!!!!!! caps lock fail', 'name').reject).toMatch(/repeated/i);
  });

  it('rejects content with more than 2 URLs', () => {
    const text = 'check https://a.com and https://b.com and https://c.com';
    expect(tier1(text, 'name').reject).toMatch(/too many links/i);
  });

  it('rejects hard-block slurs even in clean-looking text', () => {
    expect(tier1('I think this nigger should not be here', 'name').reject).toMatch(/language/i);
  });

  it('does NOT reject clean polite content', () => {
    const result = tier1('Excellent article! I learned a lot about black holes.', 'María');
    expect(result.reject).toBeFalsy();
    expect(result.flags).toEqual([]);
  });
});

describe('tier1 — soft flags', () => {
  it('flags but does not reject content with one or two URLs', () => {
    const result = tier1('Source: https://example.com', 'name');
    expect(result.reject).toBeFalsy();
    expect(result.flags.some((f) => f.startsWith('contains-'))).toBe(true);
  });

  it('flags all-caps content over 30 chars', () => {
    const result = tier1('THIS IS A VERY LONG ALL CAPS COMMENT ABOUT NOTHING', 'name');
    expect(result.reject).toBeFalsy();
    expect(result.flags).toContain('all-caps');
  });

  it('flags content with low letter ratio', () => {
    // 30 chars of !!! and few letters
    const result = tier1('hi !!! @@@ ### $$$ %%% ^^^ &&& ***', 'name');
    expect(result.reject).toBeFalsy();
    expect(result.flags).toContain('low-letter-ratio');
  });

  it('flags soft profanity', () => {
    const result = tier1('eres un pendejo bro', 'name');
    expect(result.reject).toBeFalsy();
    expect(result.flags).toContain('profanity:pendejo');
  });

  it('returns multiple flags when multiple soft signals fire', () => {
    const result = tier1(
      'PENDEJO check https://example.com !!! ##### *****',
      'name'
    );
    expect(result.reject).toBeFalsy();
    expect(result.flags).toContain('profanity:pendejo');
    expect(result.flags.some((f) => f.startsWith('contains-'))).toBe(true);
  });
});

describe('tier1 — auto-approve invariant', () => {
  // CRITICAL: a comment that auto-approves (no flags) must satisfy ALL of:
  // 1. valid name + content length
  // 2. no spam keywords
  // 3. no slurs
  // 4. no profanity
  // 5. no excess URLs / caps / repeated chars
  //
  // If a future change accidentally lets profanity-tagged content auto-approve
  // (e.g. someone removes the profanity flag emission), this test catches it.

  it('a clean comment passes through with zero flags (auto-approve eligible)', () => {
    const result = tier1('Great article, very informative!', 'Carlos');
    expect(result.reject).toBeFalsy();
    expect(result.flags).toEqual([]);
  });

  it('a comment with ANY profanity always carries a profanity:* flag', () => {
    const result = tier1('Está pendejo este artículo.', 'Carlos');
    expect(result.flags.some((f) => f.startsWith('profanity:'))).toBe(true);
  });
});
