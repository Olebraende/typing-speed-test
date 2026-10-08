export const TIMED_DURATION_SECONDS = 60;
export const TICK_INTERVAL_MS = 100;

export const DIFFICULTIES = ['easy', 'medium', 'hard'];
export const MODES = ['timed', 'passage'];

export const DEFAULT_PREFERENCES = Object.freeze({
  difficulty: 'hard',
  mode: 'timed',
});

export const STORAGE_KEY = 'typing-speed-test:v1';
export const PASSAGES_URL = './data/passages.json';
