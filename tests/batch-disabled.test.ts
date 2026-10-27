// While comments are switched off in the site settings, the scheduled batch
// must not touch the staging store or GitHub at all.

import { describe, it, expect, vi } from 'vitest';

const listStagedComments = vi.fn(async () => []);
const deleteStagedComment = vi.fn();

vi.mock('../netlify/functions/_blobs.js', () => ({ listStagedComments, deleteStagedComment }));
vi.mock('../src/data/settings.json', () => ({ default: { comments: { enabled: false } } }));

describe('batch-commit-comments with comments disabled', () => {
  it('returns before reading staged comments or calling GitHub', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const { default: handler } = await import('../netlify/functions/batch-commit-comments.js');

    const res = await handler();

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Comments disabled');
    expect(listStagedComments).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
