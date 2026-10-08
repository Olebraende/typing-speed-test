import { DEFAULT_PREFERENCES, DIFFICULTIES, MODES, STORAGE_KEY } from './config.js';

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function write(patch) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {
    // Storage may be unavailable (private mode, quota); the app still works.
  }
}

export function loadPersonalBest() {
  const { personalBest } = read();
  return Number.isFinite(personalBest) && personalBest >= 0 ? personalBest : null;
}

export function savePersonalBest(wpm) {
  write({ personalBest: wpm });
}

export function loadPreferences() {
  const { difficulty, mode } = read();
  return {
    difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : DEFAULT_PREFERENCES.difficulty,
    mode: MODES.includes(mode) ? mode : DEFAULT_PREFERENCES.mode,
  };
}

export function savePreferences({ difficulty, mode }) {
  write({ difficulty, mode });
}

export function loadSeenPassages(difficulty) {
  const { seenPassages } = read();
  const ids = seenPassages?.[difficulty];
  return Array.isArray(ids) ? ids : [];
}

export function saveSeenPassages(difficulty, ids) {
  const { seenPassages } = read();
  write({ seenPassages: { ...seenPassages, [difficulty]: ids } });
}
