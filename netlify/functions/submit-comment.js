const MAX_NAME = 60;
const MIN_CONTENT = 2;
const MAX_CONTENT = 5000;

const REPO = 'IsokGta7/pagina-web-mlany';
const BRANCH = 'master';

function bad(status, error) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function sanitize(s) {
  return String(s).replace(/<[^>]*>/g, '').trim();
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

  // Honeypot — pretend success so bots don't retry
  if (hp) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }

  if (typeof post_slug !== 'string' || !/^[a-z0-9-]+$/i.test(post_slug)) {
    return bad(400, 'Invalid post slug');
  }
  if (typeof author_name !== 'string' || !author_name.trim()) {
    return bad(400, 'Author name required');
  }
  if (typeof content !== 'string') {
    return bad(400, 'Content required');
  }

  const cleanName = sanitize(author_name).slice(0, MAX_NAME);
  const cleanContent = sanitize(content);

  if (cleanName.length === 0) return bad(400, 'Author name required');
  if (cleanContent.length < MIN_CONTENT) return bad(400, 'Comment too short');
  if (cleanContent.length > MAX_CONTENT) return bad(400, 'Comment too long');

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
    approved: false,
    created_at: now.toISOString(),
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
      message: `comment: ${cleanName} on ${post_slug}`,
      content: fileContent,
      branch: BRANCH,
    }),
  });

  if (!ghRes.ok) {
    const errText = await ghRes.text();
    console.error('GitHub API error:', ghRes.status, errText);
    return bad(502, 'Failed to save comment');
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
