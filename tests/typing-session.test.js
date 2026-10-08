import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CharState, TypingSession } from '../js/typing-session.js';

test('tracks correct and incorrect characters', () => {
  const session = new TypingSession('cat');
  session.sync('cxt');
  assert.deepEqual(
    [0, 1, 2].map((i) => session.stateAt(i)),
    [CharState.CORRECT, CharState.INCORRECT, CharState.CORRECT],
  );
});

test('errors still count after being corrected with backspace', () => {
  const session = new TypingSession('cat');
  session.sync('cx');
  session.sync('c');
  session.sync('ca');
  assert.equal(session.mistakes, 1);
  assert.equal(session.keystrokes, 3);
  assert.equal(session.correctChars, 2);
});

test('completes when the full length is typed', () => {
  const session = new TypingSession('hi');
  session.sync('h');
  assert.equal(session.isComplete, false);
  session.sync('hi');
  assert.equal(session.isComplete, true);
});

test('ignores input beyond the passage length', () => {
  const session = new TypingSession('hi');
  session.sync('hiii');
  assert.equal(session.typed, 'hi');
  assert.equal(session.keystrokes, 2);
});

test('accepts a hyphen for an em dash and a straight quote for a curly one', () => {
  const session = new TypingSession('a—b’');
  session.sync("a-b'");
  assert.equal(session.mistakes, 0);
  assert.equal(session.correctChars, 4);
});

test('sync reports the range of affected characters', () => {
  const session = new TypingSession('hello');
  assert.deepEqual(session.sync('he'), { from: 0, to: 2 });
  assert.deepEqual(session.sync('hex'), { from: 2, to: 3 });
  assert.deepEqual(session.sync('h'), { from: 1, to: 3 });
});
