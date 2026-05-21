const STORAGE_KEY = 'minesweeper-highscores';
const MAX_ENTRIES = 200;

export interface HighScoreEntry {
  playerName: string;
  mapName: string;
  difficulty: string;
  score: number;
  timeSeconds: number;
  date: string;
}

function readAll(): HighScoreEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HighScoreEntry[];
  } catch {
    return [];
  }
}

function writeAll(entries: HighScoreEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getHighScores(filterMap?: string, filterDifficulty?: string): HighScoreEntry[] {
  let entries = readAll();
  if (filterMap) entries = entries.filter((e) => e.mapName === filterMap);
  if (filterDifficulty) entries = entries.filter((e) => e.difficulty === filterDifficulty);
  return entries.sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds);
}

export function addHighScore(entry: Omit<HighScoreEntry, 'date'>): void {
  const entries = readAll();
  entries.push({ ...entry, date: new Date().toISOString() });
  // Keep only the top MAX_ENTRIES by score then time
  entries.sort((a, b) => b.score - a.score || a.timeSeconds - b.timeSeconds);
  writeAll(entries.slice(0, MAX_ENTRIES));
}
