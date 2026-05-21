import fs from 'fs';
import path from 'path';

export interface HighScoreEntry {
  playerName: string;
  mapName: string;
  difficulty: string;
  score: number;
  timeSeconds: number;
  date: string;
}

const DATA_FILE = path.join(__dirname, '..', 'data', 'highscores.json');

function readScores(): HighScoreEntry[] {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeScores(scores: HighScoreEntry[]): void {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2), 'utf-8');
}

export function getHighScores(mapName?: string, difficulty?: string): HighScoreEntry[] {
  let scores = readScores();

  if (mapName) {
    scores = scores.filter(s => s.mapName === mapName);
  }
  if (difficulty) {
    scores = scores.filter(s => s.difficulty === difficulty);
  }

  // Sort by score descending, then time ascending
  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.timeSeconds - b.timeSeconds;
  });

  return scores;
}

export function addHighScore(entry: HighScoreEntry): HighScoreEntry {
  const scores = readScores();
  scores.push(entry);
  writeScores(scores);
  return entry;
}
