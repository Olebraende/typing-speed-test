/**
 * Characters users cannot realistically type on a standard keyboard are
 * accepted through a typographic equivalent.
 */
const EQUIVALENTS = new Map([
  ['—', '-'],
  ['–', '-'],
  ['‘', "'"],
  ['’', "'"],
  ['“', '"'],
  ['”', '"'],
]);

const normalize = (char) => EQUIVALENTS.get(char) ?? char;
const matches = (expected, actual) => normalize(expected) === normalize(actual);

export const CharState = Object.freeze({
  PENDING: 'pending',
  CORRECT: 'correct',
  INCORRECT: 'incorrect',
});

/**
 * Pure model of a single attempt at a passage. It owns no DOM or timers,
 * which keeps it trivial to unit test.
 */
export class TypingSession {
  #typed = '';
  #keystrokes = 0;
  #mistakes = 0;

  constructor(text) {
    this.text = text;
  }

  get typed() {
    return this.#typed;
  }

  get cursor() {
    return this.#typed.length;
  }

  get isComplete() {
    return this.#typed.length === this.text.length;
  }

  get keystrokes() {
    return this.#keystrokes;
  }

  /** Every wrong keystroke ever made; backspacing does not erase it. */
  get mistakes() {
    return this.#mistakes;
  }

  get correctKeystrokes() {
    return this.#keystrokes - this.#mistakes;
  }

  get correctChars() {
    let count = 0;
    for (let i = 0; i < this.#typed.length; i++) {
      if (matches(this.text[i], this.#typed[i])) count++;
    }
    return count;
  }

  stateAt(index) {
    if (index >= this.#typed.length) return CharState.PENDING;
    return matches(this.text[index], this.#typed[index])
      ? CharState.CORRECT
      : CharState.INCORRECT;
  }

  /**
   * Reconciles the session with the full value of the input element.
   * Returns the half-open index range whose rendering may have changed.
   */
  sync(value) {
    const next = value.slice(0, this.text.length);
    const previousLength = this.#typed.length;

    let prefix = 0;
    const shared = Math.min(previousLength, next.length);
    while (prefix < shared && this.#typed[prefix] === next[prefix]) prefix++;

    for (let i = prefix; i < next.length; i++) {
      this.#keystrokes++;
      if (!matches(this.text[i], next[i])) this.#mistakes++;
    }

    this.#typed = next;
    return { from: prefix, to: Math.max(previousLength, next.length) };
  }
}
