import { PASSAGES_URL } from './config.js';

export async function loadPassages() {
  const response = await fetch(PASSAGES_URL);
  if (!response.ok) throw new Error(`Failed to load passages (${response.status})`);
  return response.json();
}

/**
 * Shuffle-bag selection: every passage in the pool is served once before any
 * of them repeats, and the first pick after a refill never equals the last.
 * Returns the chosen passage and the updated list of already-seen ids.
 */
export function pickPassage(pool, seenIds = []) {
  const poolIds = new Set(pool.map((passage) => passage.id));
  let seen = seenIds.filter((id) => poolIds.has(id));
  let candidates = pool.filter((passage) => !seen.includes(passage.id));

  if (candidates.length === 0) {
    const lastId = seen.at(-1);
    seen = [];
    candidates = pool.length > 1 ? pool.filter((passage) => passage.id !== lastId) : pool;
  }

  const passage = candidates[Math.floor(Math.random() * candidates.length)];
  return { passage, seenIds: [...seen, passage.id] };
}
