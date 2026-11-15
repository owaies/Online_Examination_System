import assert from 'node:assert/strict';
import { test } from 'node:test';

import { shuffleCopy } from './shuffle.mjs';

test('uses Fisher-Yates swaps to produce a deterministic permutation', () => {
  const original = ['a', 'b', 'c', 'd'];
  const randomValues = [0, 0, 0];

  const shuffled = shuffleCopy(original, () => randomValues.shift());

  assert.deepEqual(shuffled, ['b', 'c', 'd', 'a']);
  assert.deepEqual(original, ['a', 'b', 'c', 'd']);
  assert.notEqual(shuffled, original);
});

test('preserves empty and single-item arrays without mutation', () => {
  const empty = [];
  const single = ['only'];
  assert.deepEqual(shuffleCopy(empty, () => 0), []);
  assert.deepEqual(shuffleCopy(single, () => 0), ['only']);
  assert.notEqual(shuffleCopy(single, () => 0), single);
});

test('preserves duplicate values and the complete item count', () => {
  const original = ['A', 'A', 'B', 'C'];
  const shuffled = shuffleCopy(original, () => 0.5);

  assert.equal(shuffled.length, original.length);
  assert.deepEqual([...shuffled].sort(), [...original].sort());
});
