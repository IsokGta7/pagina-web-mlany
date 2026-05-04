import { tier1, sanitize, MAX_NAME, POST_SLUG_RX } from './_validation.js';
import {
  checkAndRecordRateLimit,
  hashContent,
  getCachedModeration,
  setCachedModeration,
  stageComment,
} from './_blobs.js';

const PERSPECTIVE_THRESHOLDS = {
  TOXICITY: 0.7,
  SEVERE_TOXICITY: 0.5,
  IDENTITY_ATTACK: 0.6,
  INSULT: 0.7,
  PROFANITY: 0.7,
  THREAT: 0.5,
};

function bad(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function checkPerspective(text, apiKey) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const url = `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: { text },
        languages: ['es', 'en'],
        requestedAttributes: Object.fromEntries(
          Object.keys(PERSPECTIVE_THRESHOLDS).map((k) => [k, {}])
        ),
        doNotStore: true,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Perspective HTTP error:', res.status, errText);
      return { skip: true };
    }

    const data = await res.json();
    const scores = data.attributeScores;
    if (!scores) return { skip: true };

    const flags = [];
    for (const [attr, threshold] of Object.entries(PERSPECTIVE_THRESHOLDS)) {
      const score = scores[attr]?.summaryScore?.value;
      if (typeof score === 'number' && score >= threshold) {
        flags.push(`perspective:${attr.toLowerCase()}:${score.toFixed(2)}`);
      }
    }
    return { flagged: flags.length > 0, flags };
  } catch (e) {
    console.warn('Perspective error:', e);
    return { skip: true };
  }
}

async function checkOpenAI(text, apiKey) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'omni-moderation-latest', input: text }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('OpenAI HTTP error:', res.status, errText);
      return { skip: true };
    }

    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { skip: true };

    if (result.flagged) {
      const cats = Object.entries(result.categories || {})
        .filter(([, v]) => v === true)
        .map(([k]) => `openai:${k}`);
      return { flagged: true, flags: cats.length ? cats : ['openai:flagged'] };
    }
    return { flagged: false, flags: [] };
  } catch (e) {
    console.warn('OpenAI error:', e);
    return { skip: true };
  }
}

async function tier2(text) {
  const persKey = process.env.PERSPECTIVE_API_KEY;
  const oaiKey = process.env.OPENAI_API_KEY;

  if (persKey) return await checkPerspective(text, persKey);
  if (oaiKey) return await checkOpenAI(text, oaiKey);
  return { configured: false };
}

function getClientIp(req) {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  const xrl = req.headers.get('x-nf-client-connection-ip');
  if (xrl) return xrl.trim();
  return 'unknown';
}

export default async (req) => {
  if (req.method !== 'POST') return bad(405, 'Method not allowed');

  let data;
  try {
    data = await req.json();
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const { post_slug, author_name, content, hp } = data || {};

  if (hp) return new Response(JSON.stringify({ success: true }), { status: 200 });

  // Rate limit by client IP — cheap reject before any heavy work.
  const ip = getClientIp(req);
  const rl = await checkAndRecordRateLimit(ip);
  if (rl.exceeded) {
    return new Response(
      JSON.stringify({ error: 'Has enviado demasiados comentarios. Intenta más tarde.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rl.retryAfterSec || 300),
        },
      }
    );
  }

  if (typeof post_slug !== 'string' || !POST_SLUG_RX.test(post_slug)) return bad(400, 'Invalid post slug');
  if (typeof author_name !== 'string' || typeof content !== 'string') return bad(400, 'Missing fields');

  const cleanName = sanitize(author_name).slice(0, MAX_NAME);
  const cleanContent = sanitize(content);

  const t1 = tier1(cleanContent, cleanName);
  if (t1.reject) return bad(400, t1.reject);

  let flags = t1.flags;
  let approved = flags.length === 0;

  // Moderation cache: skip the AI call when we've moderated this exact text before.
  const modKey = await hashContent(`${cleanName}\n${cleanContent}`);
  let t2 = await getCachedModeration(modKey);
  let cacheHit = !!t2;

  if (!cacheHit) {
    t2 = await tier2(`${cleanName}\n${cleanContent}`);
    // Only cache results from a successful AI call. Don't memoise transient
    // failures (skip:true) or "Tier 2 not configured" — those should retry.
    if (t2 && t2.configured !== false && !t2.skip) {
      await setCachedModeration(modKey, t2);
    }
  }

  if (t2 && t2.configured !== false) {
    if (t2.skip) {
      flags = flags.concat(['ai-moderation-unavailable']);
      approved = false;
    } else if (t2.flagged) {
      flags = flags.concat(t2.flags);
      approved = false;
    }
  }

  if (cacheHit) flags.push('cached-moderation');

  const payload = {
    post_slug,
    author_name: cleanName,
    content: cleanContent,
    approved,
    created_at: new Date().toISOString(),
    flags,
  };

  // Stage in Blobs. The scheduled batch-commit-comments function will sweep
  // staged comments into a single git commit every 5 minutes, so individual
  // submissions don't trigger Netlify rebuilds.
  try {
    await stageComment(payload);
  } catch (e) {
    console.error('Blob staging failed:', e);
    return bad(502, 'Failed to save comment');
  }

  return new Response(
    JSON.stringify({ success: true, auto_approved: approved }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
