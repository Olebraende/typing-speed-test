import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResultKind,
  calculateAccuracy,
  calculateWpm,
  classifyResult,
  formatClock,
} from '../js/metrics.js';

test('calculateWpm treats five characters as one word', () => {
  assert.equal(calculateWpm(300, 60_000), 60);
  assert.equal(calculateWpm(150, 30_000), 60);
});

test('calculateWpm does not spike on very short elapsed times', () => {
  assert.equal(calculateWpm(5, 50), 60);
  assert.equal(calculateWpm(0, 0), 0);
});

test('calculateAccuracy defaults to 100 before any keystroke', () => {
  assert.equal(calculateAccuracy(0, 0), 100);
  assert.equal(calculateAccuracy(94, 100), 94);
});

test('formatClock renders m:ss', () => {
  assert.equal(formatClock(60), '1:00');
  assert.equal(formatClock(46.2), '0:46');
  assert.equal(formatClock(-3), '0:00');
});

test('classifyResult distinguishes baseline, record and plain completion', () => {
  assert.equal(classifyResult(85, null), ResultKind.BASELINE);
  assert.equal(classifyResult(0, null), ResultKind.COMPLETE);
  assert.equal(classifyResult(96, 95), ResultKind.RECORD);
  assert.equal(classifyResult(95, 95), ResultKind.COMPLETE);
});
