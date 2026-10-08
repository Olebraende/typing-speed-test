import { formatClock } from '../metrics.js';

export class StatsView {
  #wpm = document.getElementById('stat-wpm');
  #accuracy = document.getElementById('stat-accuracy');
  #time = document.getElementById('stat-time');
  #bestValue = document.getElementById('personal-best-value');
  #bestUnit = document.getElementById('personal-best-unit');

  update({ wpm, accuracy, seconds, hasTyped, isRunning }) {
    this.#wpm.textContent = wpm;
    this.#accuracy.textContent = `${accuracy}%`;
    this.#accuracy.dataset.tone = hasTyped && accuracy < 100 ? 'bad' : 'neutral';
    this.#time.textContent = formatClock(seconds);
    this.#time.dataset.tone = isRunning ? 'warning' : 'neutral';
  }

  setPersonalBest(wpm) {
    const hasBest = wpm !== null;
    this.#bestValue.textContent = hasBest ? wpm : '–';
    this.#bestUnit.hidden = !hasBest;
  }
}
