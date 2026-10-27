// Tests for the bounded body read that runs before any JSON parsing in
// submit-comment. Oversized bodies must be refused without being parsed,
// whether or not the sender declared a Content-Length, and the largest
// submission the form can legitimately produce must still get through.

import { describe, it, expect } from 'vitest';
import { readJsonBody, MAX_BODY_BYTES } from '../netlify/functions/submit-comment.js';
import { MAX_CONTENT, MAX_NAME } from '../netlify/functions/_validation.js';

const URL = 'https://example.test/.netlify/functions/submit-comment';

function post(body: string, headers: Record<string, string> = {}) {
  return new Request(URL, { method: 'POST', body, headers });
}

// A body with no Content-Length, delivered in chunks, as a chunked upload would be.
function streamed(body: string, chunkSize = 1024) {
  const bytes = new TextEncoder().encode(body);
  let offset = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) return controller.close();
      controller.enqueue(bytes.slice(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
  return new Request(URL, { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
}

describe('readJsonBody', () => {
  it('parses a normal submission', async () => {
    const payload = { post_slug: 'computacion-cuantica', author_name: 'Ana', content: 'Muy buen artículo' };
    expect(await readJsonBody(post(JSON.stringify(payload)))).toEqual({ data: payload });
  });

  it('accepts the largest submission the form allows, even fully escaped', async () => {
    const escaped = (n: number) => '\u00e9'.repeat(n);
    const body = `{"post_slug":"computacion-cuantica","author_name":"${escaped(MAX_NAME)}","content":"${escaped(MAX_CONTENT)}","hp":""}`;
    expect(new TextEncoder().encode(body).length).toBeLessThanOrEqual(MAX_BODY_BYTES);
    const out = await readJsonBody(post(body));
    expect(out.data.content).toBe('é'.repeat(MAX_CONTENT));
  });

  it('refuses a declared Content-Length over the limit without reading the body', async () => {
    const req = post('{}', { 'content-length': String(MAX_BODY_BYTES + 1) });
    expect(await readJsonBody(req)).toEqual({ status: 413 });
    expect(req.bodyUsed).toBe(false);
  });

  it('refuses an oversized body that declares no length', async () => {
    const big = JSON.stringify({ content: 'a'.repeat(MAX_BODY_BYTES) });
    expect(await readJsonBody(streamed(big))).toEqual({ status: 413 });
  });

  it('stops at the limit for a body sent as a plain string', async () => {
    const big = JSON.stringify({ content: 'a'.repeat(MAX_BODY_BYTES) });
    expect(await readJsonBody(post(big), 1024)).toEqual({ status: 413 });
  });

  it('decodes multi-byte characters split across chunks', async () => {
    const payload = { content: 'ñandú '.repeat(400) };
    expect(await readJsonBody(streamed(JSON.stringify(payload), 7))).toEqual({ data: payload });
  });

  it('reports malformed JSON and a missing body as 400', async () => {
    expect(await readJsonBody(post('{not json'))).toEqual({ status: 400 });
    expect(await readJsonBody(new Request(URL, { method: 'POST' }))).toEqual({ status: 400 });
  });
});
