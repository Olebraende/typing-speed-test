import { CharState } from '../typing-session.js';

const STATE_CLASS = {
  [CharState.CORRECT]: 'is-correct',
  [CharState.INCORRECT]: 'is-incorrect',
  [CharState.PENDING]: null,
};

export class PassageView {
  #root;
  #chars = [];
  #cursorIndex = -1;

  constructor(root) {
    this.#root = root;
  }

  render(text) {
    const fragment = document.createDocumentFragment();
    this.#chars = [];
    this.#cursorIndex = -1;

    let word = null;
    for (const character of text) {
      const element = document.createElement('span');
      element.className = 'char';
      element.textContent = character;
      this.#chars.push(element);

      if (character === ' ') {
        word = null;
        fragment.append(element);
        continue;
      }
      if (!word) {
        word = document.createElement('span');
        word.className = 'word';
        fragment.append(word);
      }
      word.append(element);
    }

    this.#root.replaceChildren(fragment);
  }

  /** Repaints only the characters in [from, to) and moves the cursor. */
  update(session, { from, to }) {
    for (let i = from; i < to && i < this.#chars.length; i++) {
      this.#paint(this.#chars[i], session.stateAt(i));
    }
    this.#moveCursor(session.isComplete ? -1 : session.cursor);
  }

  #paint(element, state) {
    element.classList.remove('is-correct', 'is-incorrect');
    const className = STATE_CLASS[state];
    if (className) element.classList.add(className);
  }

  #moveCursor(index) {
    this.#chars[this.#cursorIndex]?.classList.remove('is-cursor');
    this.#cursorIndex = index;
    const next = this.#chars[index];
    if (!next) return;
    next.classList.add('is-cursor');
    next.scrollIntoView({ block: 'nearest' });
  }

  showCursorAtStart() {
    this.#moveCursor(0);
  }
}
