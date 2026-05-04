// Helpers around @netlify/blobs for the comment pipeline.
//
// Three stores:
//   rate-limit/{ip}        → array of recent submission timestamps (ms)
//   mod-cache/{hash}       → { result, expires } cached AI moderation
//   staged-comments/{id}   → comment payload waiting for batch commit
//
// All store names use the consistency: 'strong' option where read-after-write
// matters (rate limit, staged) so two near-simultaneous requests don't race.

import { getStore } from '@netlify/blobs';

const RATE_LIMIT_MAX = 5;          // max comments
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;  // per 5 minutes per IP
const MOD_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days

function rateStore() {
  return getStore({ name: 'rate-limit', consistency: 'strong' });
}

function modStore() {
  return getStore({ name: 'mod-cache' });
}

function stagedStore() {
  return getStore({ name: 'staged-comments', consistency: 'strong' });
}

export async function checkAndRecordRateLimit(ip) {
  if (!ip || ip === 'unknown') return { exceeded: false };
  const store = rateStore();
  const existing = (await store.get(ip, { type: 'json' })) || [];
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const recent = existing.filter((t) => typeof t === 'number' && t > cutoff);
  if (recent.length >= RATE_LIMIT_MAX) {
    return {
      exceeded: true,
      retryAfterSec: Math.ceil((recent[0] + RATE_LIMIT_WINDOW_MS - now) / 1000),
    };
  }
  recent.push(now);
  await store.setJSON(ip, recent);
  return { exceeded: false };
}

export async function hashContent(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function getCachedModeration(hash) {
  const cached = await modStore().get(hash, { type: 'json' });
  if (!cached) return null;
  if (cached.expires && cached.expires < Date.now()) return null;
  return cached.result;
}

export async function setCachedModeration(hash, result) {
  await modStore().setJSON(hash, {
    result,
    expires: Date.now() + MOD_CACHE_TTL_MS,
  });
}

export async function stageComment(payload) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await stagedStore().setJSON(id, payload);
  return id;
}

export async function listStagedComments() {
  const store = stagedStore();
  const { blobs } = await store.list();
  const items = await Promise.all(
    blobs.map(async ({ key }) => ({
      key,
      payload: await store.get(key, { type: 'json' }),
    }))
  );
  return items.filter((i) => i.payload != null);
}

export async function deleteStagedComment(key) {
  await stagedStore().delete(key);
}
