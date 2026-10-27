// Scheduled function: every 5 minutes, sweep staged comments out of Netlify
// Blobs and into a single git commit. One commit → one Netlify build,
// regardless of how many comments arrived in the window. If no comments are
// staged, exit immediately so we don't even hit GitHub.
//
// Uses the GitHub Git Data API (blobs → tree → commit → ref) instead of the
// Contents API so all files land in a single commit atomically.

import { listStagedComments, deleteStagedComment } from './_blobs.js';

const REPO = 'IsokGta7/pagina-web-mlany';
const BRANCH = 'master';

// Each comment costs one GitHub blob request, plus three for the tree, commit
// and ref. At 25 per run and one run every 5 minutes that stays under
// GitHub's limits on content-creating requests (80 a minute, 500 an hour), so
// a backlog drains over several runs instead of failing as one oversized batch
// on every run.
export const MAX_BATCH = 25;

// Oldest first, so a backlog is committed in the order it arrived. Staged keys
// start with the Date.now() of submission, so they sort chronologically.
export function selectBatch(staged, max = MAX_BATCH) {
  return [...staged].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)).slice(0, max);
}

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'ciensite-comments-batch',
  };
}

async function gh(token, path, options = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: { ...ghHeaders(token), ...(options.headers || {}) },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`GitHub ${path} ${res.status}: ${errText}`);
  }
  return res.json();
}

export default async () => {
  const token = process.env.COMMENT_GH_TOKEN;
  if (!token) {
    console.error('COMMENT_GH_TOKEN env var not set');
    return new Response('Server misconfigured', { status: 500 });
  }

  const allStaged = await listStagedComments();
  if (allStaged.length === 0) {
    return new Response('No staged comments', { status: 200 });
  }

  const staged = selectBatch(allStaged);
  const left = allStaged.length - staged.length;
  console.log(
    `Batching ${staged.length} staged comment(s) into one commit` +
      (left > 0 ? `; ${left} left for later runs` : '')
  );

  // 1. Get current branch ref + base commit + base tree
  const ref = await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`);
  const baseSha = ref.object.sha;
  const baseCommit = await gh(token, `/repos/${REPO}/git/commits/${baseSha}`);

  // 2. Create a blob for each staged comment, then build the tree entries
  const treeItems = await Promise.all(
    staged.map(async ({ key, payload }) => {
      const tsKey = new Date(payload.created_at).toISOString().replace(/[:.]/g, '-');
      const random = Math.random().toString(36).slice(2, 8);
      const filename = `${tsKey}--${random}.json`;
      const path = `src/content/comments/${filename}`;
      const fileContent = JSON.stringify(payload, null, 2) + '\n';

      const blob = await gh(token, `/repos/${REPO}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: Buffer.from(fileContent, 'utf8').toString('base64'),
          encoding: 'base64',
        }),
      });

      return {
        stagedKey: key,
        treeItem: { path, mode: '100644', type: 'blob', sha: blob.sha },
      };
    })
  );

  // 3. Build a new tree on top of the current one
  const newTree = await gh(token, `/repos/${REPO}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: treeItems.map((t) => t.treeItem),
    }),
  });

  // 4. Create a single commit containing all of them
  const message =
    staged.length === 1
      ? `comments: 1 new submission`
      : `comments: batch of ${staged.length} submissions`;

  const newCommit = await gh(token, `/repos/${REPO}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message,
      tree: newTree.sha,
      parents: [baseSha],
    }),
  });

  // 5. Move the branch tip to the new commit
  await gh(token, `/repos/${REPO}/git/refs/heads/${BRANCH}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: newCommit.sha }),
  });

  // 6. Drop the staged blobs only after the commit succeeded. If something
  //    goes wrong above, the staged comments stay put for the next run.
  for (const { stagedKey } of treeItems) {
    try {
      await deleteStagedComment(stagedKey);
    } catch (e) {
      console.warn('Failed to delete staged blob', stagedKey, e);
    }
  }

  return new Response(`Committed ${staged.length} comment(s) as ${newCommit.sha.slice(0, 7)}`, {
    status: 200,
  });
};

export const config = {
  schedule: '*/5 * * * *',
};
