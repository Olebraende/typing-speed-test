import { ResultKind } from '../metrics.js';
import { launchConfetti } from './confetti.js';

const ICON_COMPLETED = './assets/images/icon-completed.svg';
const ICON_RECORD = './assets/images/icon-new-pb.svg';

const COPY = {
  [ResultKind.BASELINE]: {
    title: 'Baseline Established!',
    message: 'You’ve set the bar. Now the real challenge begins—time to beat it.',
    action: 'Beat This Score',
    icon: ICON_COMPLETED,
  },
  [ResultKind.RECORD]: {
    title: 'High Score Smashed!',
    message: 'You’re getting faster. That was incredible typing.',
    action: 'Beat This Score',
    icon: ICON_RECORD,
  },
  [ResultKind.COMPLETE]: {
    title: 'Test Complete!',
    message: 'Solid run. Keep pushing to beat your high score.',
    action: 'Go Again',
    icon: ICON_COMPLETED,
  },
};

export class ResultsView {
  #root = document.getElementById('results-view');
  #title = document.getElementById('results-title');
  #message = document.getElementById('results-message');
  #icon = document.getElementById('results-icon');
  #wpm = document.getElementById('result-wpm');
  #accuracy = document.getElementById('result-accuracy');
  #correct = document.getElementById('result-correct');
  #incorrect = document.getElementById('result-incorrect');
  #action = document.getElementById('again-label');
  #stopConfetti = () => {};

  show({ kind, wpm, accuracy, correct, incorrect }) {
    const copy = COPY[kind];
    this.#root.dataset.kind = kind;
    this.#title.textContent = copy.title;
    this.#message.textContent = copy.message;
    this.#action.textContent = copy.action;
    this.#icon.src = copy.icon;
    this.#wpm.textContent = wpm;
    this.#accuracy.textContent = `${accuracy}%`;
    this.#accuracy.dataset.tone = accuracy === 100 ? 'good' : 'bad';
    this.#correct.textContent = correct;
    this.#incorrect.textContent = incorrect;

    this.#root.hidden = false;
    this.#title.focus({ preventScroll: true });

    this.#stopConfetti();
    if (kind === ResultKind.RECORD) this.#stopConfetti = launchConfetti();
  }

  hide() {
    this.#stopConfetti();
    this.#root.hidden = true;
  }
}
