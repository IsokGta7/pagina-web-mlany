// Tests for the client-IP lookup that keys the comment rate limit.
//
// The rate limit is only as strong as the IP it is keyed on. `x-forwarded-for`
// is a client-writable header: a sender can prefix it with any value and
// Netlify keeps that prefix, so the first entry must never be trusted. Netlify
// itself exposes the real client address as `context.ip` (Functions 2.0) and
// in the `x-nf-client-connection-ip` header it sets at the edge; those are the
// only sources this lookup may use.

import { describe, it, expect } from 'vitest';
import { getClientIp } from '../netlify/functions/submit-comment.js';

function request(headers: Record<string, string>) {
  return new Request('https://example.test/.netlify/functions/submit-comment', {
    method: 'POST',
    headers,
  });
}

describe('getClientIp', () => {
  it('prefers context.ip over any header', () => {
    const req = request({
      'x-forwarded-for': '1.1.1.1, 203.0.113.9',
      'x-nf-client-connection-ip': '203.0.113.9',
    });
    expect(getClientIp(req, { ip: '203.0.113.9' })).toBe('203.0.113.9');
  });

  it('falls back to the Netlify-set connection header when context has no ip', () => {
    const req = request({
      'x-forwarded-for': '1.1.1.1, 203.0.113.9',
      'x-nf-client-connection-ip': '203.0.113.9',
    });
    expect(getClientIp(req, {})).toBe('203.0.113.9');
    expect(getClientIp(req, undefined)).toBe('203.0.113.9');
  });

  it('never keys on x-forwarded-for, which the sender controls', () => {
    const req = request({ 'x-forwarded-for': '1.1.1.1' });
    expect(getClientIp(req, undefined)).toBe('unknown');
  });

  it('trims whitespace around the address', () => {
    expect(getClientIp(request({}), { ip: '  203.0.113.9 ' })).toBe('203.0.113.9');
    expect(getClientIp(request({ 'x-nf-client-connection-ip': ' 203.0.113.9 ' }), {})).toBe(
      '203.0.113.9'
    );
  });

  it('reports unknown when no trusted source is present', () => {
    expect(getClientIp(request({}), {})).toBe('unknown');
    expect(getClientIp(request({}), { ip: '' })).toBe('unknown');
  });
});
