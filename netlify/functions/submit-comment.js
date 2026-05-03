const MAX_NAME = 60;
const MIN_CONTENT = 2;
const MAX_CONTENT = 5000;
const MAX_LINKS = 2;
const MIN_TEXT_RATIO = 0.5;

const REPO = 'IsokGta7/pagina-web-mlany';
const BRANCH = 'master';

// Hard reject: words/phrases that should never reach the moderation queue.
// Conservative list — keep tight to avoid false positives. Extend in the repo
// when you spot patterns in the spam queue.
const BLOCKLIST_RX = [
  /\b(viagra|cialis|tadalafil|sildenafil)\b/i,
  /\b(casino|poker|bet365|betway)\b/i,
  /\b(crypto.{0,5}invest|forex.{0,5}trad|bitcoin.{0,5}profit)\b/i,
  /\b(buy now|click here|earn .{0,5}\$|make money fast)\b/i,
  /\b(free .{0,5}(iphone|gift card)|won .{0,5}prize)\b/i,
];

const URL_RX = /https?:\/\/[^\s]+|www\.[^\s]+|\b[a-z0-9-]+\.(com|net|org|io|app|me|co|ru|cn|tk|ml)\/?[^\s]*/gi;
const REPEATED_CHAR_RX = /(.)\1{6,}/;
const ALL_CAPS_RX = /^[^a-zà-ÿ]{20,}$/;

function bad(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sanitize(s) {
  return String(s).replace(/<[^>]*>/g, '').trim();
}

function tier1(content, name) {
  const flags = [];

  if (name.length === 0) return { reject: 'Author name required' };
  if (name.length > MAX_NAME) return { reject: 'Author name too long' };
  if (content.length < MIN_CONTENT) return { reject: 'Comment too short' };
  if (content.length > MAX_CONTENT) return { reject: 'Comment too long' };

  for (const rx of BLOCKLIST_RX) {
    if (rx.test(content) || rx.test(name)) {
      return { reject: 'Content rejected by spam filter' };
    }
  }

  if (REPEATED_CHAR_RX.test(content)) {
    return { reject: 'Spam-like repeated characters' };
  }

  if (ALL_CAPS_RX.test(content) && content.length > 30) {
    flags.push('all-caps');
  }

  const urls = content.match(URL_RX) || [];
  if (urls.length > MAX_LINKS) {
    return { reject: 'Too many links' };
  }
  if (urls.length > 0) flags.push(`contains-${urls.length}-link${urls.length > 1 ? 's' : ''}`);

  if (content.length > 20) {
    const letters = (content.match(/\p{L}/gu) || []).length;
    const ratio = letters / content.length;
    if (ratio < MIN_TEXT_RATIO) flags.push('low-letter-ratio');
  }

  return { ok: true, flags };
}

async function tier2(text, apiKey) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'omni-moderation-latest',
        input: text,
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text();
      console.warn('OpenAI moderation HTTP error:', res.status, errText);
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
    console.warn('OpenAI moderation error:', e);
    return { skip: true };
  }
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

  if (hp) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (typeof post_slug !== 'string' || !/^[a-z0-9-]+$/i.test(post_slug)) {
    return bad(400, 'Invalid post slug');
  }
  if (typeof author_name !== 'string' || typeof content !== 'string') {
    return bad(400, 'Missing fields');
  }

  const cleanName = sanitize(author_name).slice(0, MAX_NAME);
  const cleanContent = sanitize(content);

  const t1 = tier1(cleanContent, cleanName);
  if (t1.reject) return bad(400, t1.reject);

  let flags = t1.flags;
  let approved = flags.length === 0;

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const t2 = await tier2(`${cleanName}\n${cleanContent}`, apiKey);
    if (t2.skip) {
      flags = flags.concat(['ai-moderation-unavailable']);
      approved = false;
    } else if (t2.flagged) {
      flags = flags.concat(t2.flags);
      approved = false;
    }
  }

  const token = process.env.COMMENT_GH_TOKEN;
  if (!token) {
    console.error('COMMENT_GH_TOKEN env var not set');
    return bad(500, 'Server misconfigured');
  }

  const now = new Date();
  const tsKey = now.toISOString().replace(/[:.]/g, '-');
  const random = Math.random().toString(36).slice(2, 8);
  const filename = `${tsKey}--${random}.json`;
  const path = `src/content/comments/${filename}`;

  const payload = {
    post_slug,
    author_name: cleanName,
    content: cleanContent,
    approved,
    created_at: now.toISOString(),
    flags,
  };

  const fileContent = Buffer.from(JSON.stringify(payload, null, 2) + '\n', 'utf8').toString('base64');

  const ghRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'ciensite-comments',
    },
    body: JSON.stringify({
      message: `comment: ${cleanName} on ${post_slug}${approved ? ' (auto-approved)' : ''}`,
      content: fileContent,
      branch: BRANCH,
    }),
  });

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    console.error('GitHub API error:', ghRes.status, errText);
    return bad(502, 'Failed to save comment');
  }

  return new Response(
    JSON.stringify({ success: true, auto_approved: approved }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
