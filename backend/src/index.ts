import express from 'express';
import cors from 'cors';
import { highscoresRouter } from './routes/highscores';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/highscores', highscoresRouter);

app.listen(PORT, () => {
  console.log(`Minesweeper Evolved backend running on http://localhost:${PORT}`);
});
