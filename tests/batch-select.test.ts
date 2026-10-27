// Tests for how the scheduled batch picks which staged comments go into one
// commit. A backlog must drain oldest first and in bounded batches, so one
// run never tries to commit an unbounded number of files.

import { describe, it, expect } from 'vitest';
import { selectBatch, MAX_BATCH } from '../netlify/functions/batch-commit-comments.js';

// Staged keys are `${Date.now()}-${random}`, as stageComment writes them.
const item = (ms: number, suffix = 'abcd1234') => ({ key: `${ms}-${suffix}`, payload: { ms } });

describe('selectBatch', () => {
  it('keeps every comment when the backlog fits in one batch', () => {
    const staged = [item(1761500000002), item(1761500000001)];
    expect(selectBatch(staged).map((s) => s.payload.ms)).toEqual([1761500000001, 1761500000002]);
  });

  it('takes at most MAX_BATCH comments, oldest first', () => {
    const staged = Array.from({ length: MAX_BATCH + 10 }, (_, i) => item(1761500000000 + (MAX_BATCH + 10 - i)));
    const batch = selectBatch(staged);
    expect(batch).toHaveLength(MAX_BATCH);
    const picked = batch.map((s) => s.payload.ms);
    expect(picked).toEqual([...picked].sort((a, b) => a - b));
    expect(picked[0]).toBe(1761500000001);
    expect(picked[MAX_BATCH - 1]).toBe(1761500000000 + MAX_BATCH);
  });

  it('honours an explicit cap', () => {
    const staged = [item(1761500000003), item(1761500000001), item(1761500000002)];
    expect(selectBatch(staged, 2).map((s) => s.payload.ms)).toEqual([1761500000001, 1761500000002]);
  });

  it('caps a batch at a size GitHub can absorb every five minutes', () => {
    expect(MAX_BATCH).toBeGreaterThan(0);
    expect(MAX_BATCH + 3).toBeLessThanOrEqual(80);
    expect((MAX_BATCH + 3) * 12).toBeLessThanOrEqual(500);
  });

  it('does not reorder the list it was given', () => {
    const staged = [item(2), item(1)];
    selectBatch(staged);
    expect(staged.map((s) => s.payload.ms)).toEqual([2, 1]);
  });

  it('returns nothing for an empty backlog', () => {
    expect(selectBatch([])).toEqual([]);
  });
});
