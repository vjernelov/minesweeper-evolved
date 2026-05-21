import { Router, Request, Response } from 'express';
import { getHighScores, addHighScore, HighScoreEntry } from '../storage';

export const highscoresRouter = Router();

const VALID_MAPS = ['hormuz', 'oresund', 'gulfOfMexico'];
const VALID_DIFFICULTIES = ['easy', 'normal', 'expert'];

highscoresRouter.get('/', (req: Request, res: Response) => {
  const mapName = req.query.map as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;

  if (mapName && !VALID_MAPS.includes(mapName)) {
    res.status(400).json({ error: 'Invalid map name' });
    return;
  }
  if (difficulty && !VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: 'Invalid difficulty' });
    return;
  }

  const scores = getHighScores(mapName, difficulty);
  res.json(scores);
});

highscoresRouter.post('/', (req: Request, res: Response) => {
  const { playerName, mapName, difficulty, score, timeSeconds } = req.body;

  // Validate required fields
  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    res.status(400).json({ error: 'playerName is required' });
    return;
  }
  if (playerName.length > 30) {
    res.status(400).json({ error: 'playerName must be 30 characters or less' });
    return;
  }
  if (!mapName || !VALID_MAPS.includes(mapName)) {
    res.status(400).json({ error: 'Invalid map name' });
    return;
  }
  if (!difficulty || !VALID_DIFFICULTIES.includes(difficulty)) {
    res.status(400).json({ error: 'Invalid difficulty' });
    return;
  }
  if (typeof score !== 'number' || score < 0) {
    res.status(400).json({ error: 'score must be a non-negative number' });
    return;
  }
  if (typeof timeSeconds !== 'number' || timeSeconds < 0) {
    res.status(400).json({ error: 'timeSeconds must be a non-negative number' });
    return;
  }

  const entry: HighScoreEntry = {
    playerName: playerName.trim(),
    mapName,
    difficulty,
    score,
    timeSeconds,
    date: new Date().toISOString(),
  };

  const saved = addHighScore(entry);
  res.status(201).json(saved);
});
