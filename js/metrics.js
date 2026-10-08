const CHARS_PER_WORD = 5;
const MIN_ELAPSED_MS = 1000;

export const ResultKind = Object.freeze({
  BASELINE: 'baseline',
  RECORD: 'record',
  COMPLETE: 'complete',
});

/** Standard WPM: one "word" is five characters. */
export function calculateWpm(correctChars, elapsedMs) {
  if (correctChars <= 0) return 0;
  // Clamp the divisor so the first keystrokes do not produce absurd spikes.
  const minutes = Math.max(elapsedMs, MIN_ELAPSED_MS) / 60_000;
  return Math.round(correctChars / CHARS_PER_WORD / minutes);
}

export function calculateAccuracy(correctKeystrokes, totalKeystrokes) {
  if (totalKeystrokes === 0) return 100;
  return Math.round((correctKeystrokes / totalKeystrokes) * 100);
}

export function formatClock(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function classifyResult(wpm, personalBest) {
  if (personalBest === null) {
    return wpm > 0 ? ResultKind.BASELINE : ResultKind.COMPLETE;
  }
  return wpm > personalBest ? ResultKind.RECORD : ResultKind.COMPLETE;
}
