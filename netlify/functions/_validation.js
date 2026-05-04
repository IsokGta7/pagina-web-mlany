// Pure-function validation pipeline for incoming comments.
// Lives outside submit-comment.js so the CI suite can import it without
// pulling in @netlify/blobs (which only resolves inside the Functions runtime).
//
// `tier1(content, name)` returns either { reject: <msg> } for hard rejections
// or { ok: true, flags: [...] } where flags is an array of soft-flag tags
// describing why a moderator should look at this comment. Flags do NOT block
// the comment — the caller in submit-comment.js maps non-empty flags into
// `approved: false` so the comment goes through manual review.

import { findProfanity, findHardBlock } from './_profanity.js';

export const MAX_NAME = 60;
export const MIN_CONTENT = 2;
export const MAX_CONTENT = 5000;
export const MAX_LINKS = 2;
export const MIN_TEXT_RATIO = 0.5;

// Hard reject: commercial spam patterns. Keep tight to avoid false positives.
export const SPAM_BLOCKLIST_RX = [
  /\b(viagra|cialis|tadalafil|sildenafil)\b/i,
  /\b(casino|poker|bet365|betway)\b/i,
  /\b(crypto.{0,5}invest|forex.{0,5}trad|bitcoin.{0,5}profit)\b/i,
  /\b(buy now|click here|earn .{0,5}\$|make money fast)\b/i,
  /\b(free .{0,5}(iphone|gift card)|won .{0,5}prize)\b/i,
];

export const URL_RX = /https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(com|net|org|io|app|me|co|ru|cn|tk|ml)\/?[^\s]*/gi;
export const REPEATED_CHAR_RX = /(.)\1{6,}/;
export const ALL_CAPS_RX = /^[^a-zà-ÿ]{20,}$/;
export const POST_SLUG_RX = /^[a-z0-9-]+$/i;

export function sanitize(s) {
  return String(s).replace(/<[^>]*>/g, '').trim();
}

export function tier1(content, name) {
  const flags = [];
  const combined = `${name} ${content}`;

  if (name.length === 0) return { reject: 'Author name required', flags: [] };
  if (name.length > MAX_NAME) return { reject: 'Author name too long', flags: [] };
  if (content.length < MIN_CONTENT) return { reject: 'Comment too short', flags: [] };
  if (content.length > MAX_CONTENT) return { reject: 'Comment too long', flags: [] };

  for (const rx of SPAM_BLOCKLIST_RX) {
    if (rx.test(content) || rx.test(name)) {
      return { reject: 'Content rejected by spam filter', flags: [] };
    }
  }

  const slur = findHardBlock(combined);
  if (slur) return { reject: 'Content rejected by language filter', flags: [] };

  if (REPEATED_CHAR_RX.test(content)) {
    return { reject: 'Spam-like repeated characters', flags: [] };
  }

  if (ALL_CAPS_RX.test(content) && content.length > 30) {
    flags.push('all-caps');
  }

  const urls = content.match(URL_RX) || [];
  if (urls.length > MAX_LINKS) {
    return { reject: 'Too many links', flags: [] };
  }
  if (urls.length > 0) flags.push(`contains-${urls.length}-link${urls.length > 1 ? 's' : ''}`);

  if (content.length > 20) {
    const letters = (content.match(/\p{L}/gu) || []).length;
    const ratio = letters / content.length;
    if (ratio < MIN_TEXT_RATIO) flags.push('low-letter-ratio');
  }

  const profanityHits = findProfanity(combined);
  for (const word of profanityHits) flags.push(`profanity:${word}`);

  return { reject: null, flags };
}
