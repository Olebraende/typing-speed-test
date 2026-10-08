import { TICK_INTERVAL_MS, TIMED_DURATION_SECONDS } from './config.js';
import {
  ResultKind,
  calculateAccuracy,
  calculateWpm,
  classifyResult,
} from './metrics.js';
import { pickPassage } from './passages.js';
import {
  loadPersonalBest,
  loadPreferences,
  loadSeenPassages,
  savePersonalBest,
  savePreferences,
  saveSeenPassages,
} from './storage.js';
import { TypingSession } from './typing-session.js';
import { PassageView } from './views/passage-view.js';
import { ResultsView } from './views/results-view.js';
import { SelectMenu } from './views/select-menu.js';
import { StatsView } from './views/stats-view.js';

const Phase = Object.freeze({
  IDLE: 'idle',
  READY: 'ready',
  RUNNING: 'running',
});

const DURATION_MS = TIMED_DURATION_SECONDS * 1000;

const TAGLINES = {
  timed: `Type as fast as you can in ${TIMED_DURATION_SECONDS} seconds`,
  passage: 'Type the full passage at your own pace',
};

const NAVIGATION_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Enter',
  'Tab',
]);

export class App {
  #passages;
  #preferences = loadPreferences();
  #personalBest = loadPersonalBest();

  #phase = Phase.IDLE;
  #passage = null;
  #session = null;
  #startedAt = 0;
  #timerId = null;

  #testView = document.getElementById('test-view');
  #tagline = document.getElementById('tagline');
  #overlay = document.getElementById('overlay');
  #input = document.getElementById('typing-input');
  #startButton = document.getElementById('start-button');
  #restartButton = document.getElementById('restart-button');
  #againButton = document.getElementById('again-button');
  #passageElement = document.getElementById('passage');

  #passageView = new PassageView(this.#passageElement);
  #statsView = new StatsView();
  #resultsView = new ResultsView();
  #menus = {};

  constructor(passages) {
    this.#passages = passages;
  }

  init() {
    this.#initMenus();
    this.#bindEvents();
    this.#statsView.setPersonalBest(this.#personalBest);
    this.#reset();
  }

  #initMenus() {
    const [difficulty, mode] = document.querySelectorAll('[data-select]');
    this.#menus.difficulty = new SelectMenu(difficulty, {
      onChange: (value) => this.#updatePreference('difficulty', value),
    });
    this.#menus.mode = new SelectMenu(mode, {
      onChange: (value) => this.#updatePreference('mode', value),
    });
    this.#menus.difficulty.value = this.#preferences.difficulty;
    this.#menus.mode.value = this.#preferences.mode;
  }

  #bindEvents() {
    this.#startButton.addEventListener('click', () => this.#start());
    this.#restartButton.addEventListener('click', () => this.#reset());
    this.#againButton.addEventListener('click', () => {
      this.#resultsView.hide();
      this.#testView.hidden = false;
      this.#reset();
      this.#startButton.focus();
    });

    this.#overlay.addEventListener('click', (event) => {
      if (event.target !== this.#startButton) this.#arm();
    });
    this.#passageElement.addEventListener('click', () => this.#focusInput());

    this.#input.addEventListener('input', () => this.#handleInput());
    this.#input.addEventListener('keydown', (event) => this.#handleKeydown(event));
    this.#input.addEventListener('paste', (event) => event.preventDefault());
  }

  #updatePreference(key, value) {
    this.#preferences = { ...this.#preferences, [key]: value };
    savePreferences(this.#preferences);
    this.#reset();
  }

  /** Loads a fresh passage and returns to the pre-start state. */
  #reset() {
    this.#stopTimer();
    this.#phase = Phase.IDLE;
    this.#passage = this.#nextPassage();
    this.#session = new TypingSession(this.#passage.text);
    this.#input.value = '';
    this.#input.blur();

    this.#tagline.textContent = TAGLINES[this.#preferences.mode];
    this.#testView.dataset.state = this.#phase;
    this.#passageView.render(this.#passage.text);
    this.#renderStats(0);
  }

  #nextPassage() {
    const { difficulty } = this.#preferences;
    const { passage, seenIds } = pickPassage(
      this.#passages[difficulty],
      loadSeenPassages(difficulty),
    );
    saveSeenPassages(difficulty, seenIds);
    return passage;
  }

  /** The passage was clicked: wait for the first keystroke to start the clock. */
  #arm() {
    if (this.#phase !== Phase.IDLE) return;
    this.#phase = Phase.READY;
    this.#testView.dataset.state = this.#phase;
    this.#passageView.showCursorAtStart();
    this.#focusInput();
  }

  #start() {
    if (this.#phase === Phase.RUNNING) return;
    if (this.#phase === Phase.IDLE) this.#arm();
    this.#phase = Phase.RUNNING;
    this.#testView.dataset.state = this.#phase;
    this.#startedAt = performance.now();
    this.#timerId = setInterval(() => this.#tick(), TICK_INTERVAL_MS);
    this.#focusInput();
  }

  #focusInput() {
    this.#input.focus({ preventScroll: true });
  }

  #handleKeydown(event) {
    if (event.key === 'Escape') {
      this.#reset();
      this.#startButton.focus();
      return;
    }
    const isShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() !== 'backspace';
    if (NAVIGATION_KEYS.has(event.key) || isShortcut) event.preventDefault();
  }

  #handleInput() {
    if (this.#phase === Phase.IDLE) return;
    if (this.#phase === Phase.READY) this.#start();

    const change = this.#session.sync(this.#input.value);
    // Keep the field in lock-step with the (clamped) session value.
    if (this.#input.value !== this.#session.typed) this.#input.value = this.#session.typed;

    this.#passageView.update(this.#session, change);

    if (this.#session.isComplete) {
      this.#finish(this.#elapsedMs());
      return;
    }
    this.#renderStats(this.#elapsedMs());
  }

  #tick() {
    const elapsed = this.#elapsedMs();
    if (this.#preferences.mode === 'timed' && elapsed >= DURATION_MS) {
      this.#finish(DURATION_MS);
      return;
    }
    this.#renderStats(elapsed);
  }

  #elapsedMs() {
    return this.#phase === Phase.RUNNING ? performance.now() - this.#startedAt : 0;
  }

  #snapshot(elapsedMs) {
    const session = this.#session;
    return {
      wpm: calculateWpm(session.correctChars, elapsedMs),
      accuracy: calculateAccuracy(session.correctKeystrokes, session.keystrokes),
    };
  }

  #renderStats(elapsedMs) {
    const { wpm, accuracy } = this.#snapshot(elapsedMs);
    const seconds =
      this.#preferences.mode === 'timed'
        ? Math.ceil((DURATION_MS - elapsedMs) / 1000)
        : Math.floor(elapsedMs / 1000);

    this.#statsView.update({
      wpm,
      accuracy,
      seconds,
      hasTyped: this.#session.keystrokes > 0,
      isRunning: this.#phase === Phase.RUNNING,
    });
  }

  #stopTimer() {
    clearInterval(this.#timerId);
    this.#timerId = null;
  }

  #finish(elapsedMs) {
    this.#stopTimer();
    this.#input.blur();

    const { wpm, accuracy } = this.#snapshot(elapsedMs);
    const kind = classifyResult(wpm, this.#personalBest);

    if (kind === ResultKind.BASELINE || kind === ResultKind.RECORD) {
      this.#personalBest = wpm;
      savePersonalBest(wpm);
      this.#statsView.setPersonalBest(wpm);
    }

    this.#testView.hidden = true;
    this.#resultsView.show({
      kind,
      wpm,
      accuracy,
      correct: this.#session.correctChars,
      incorrect: this.#session.mistakes,
    });
  }
}
