import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickPassage } from '../js/passages.js';

const pool = ['a', 'b', 'c', 'd'].map((id) => ({ id, text: id }));

test('serves every passage once before repeating', () => {
  let seen = [];
  const served = [];
  for (let i = 0; i < pool.length; i++) {
    const result = pickPassage(pool, seen);
    served.push(result.passage.id);
    seen = result.seenIds;
  }
  assert.deepEqual([...served].sort(), ['a', 'b', 'c', 'd']);
});

test('never repeats the last passage right after a refill', () => {
  for (let i = 0; i < 50; i++) {
    const { passage } = pickPassage(pool, ['a', 'b', 'c', 'd']);
    assert.notEqual(passage.id, 'd');
  }
});

test('ignores stale ids that are no longer in the pool', () => {
  const { passage, seenIds } = pickPassage(pool, ['gone-1', 'gone-2']);
  assert.ok(pool.includes(passage));
  assert.deepEqual(seenIds, [passage.id]);
});

test('works with a single-passage pool', () => {
  const only = [{ id: 'x', text: 'x' }];
  assert.equal(pickPassage(only, ['x']).passage.id, 'x');
});
