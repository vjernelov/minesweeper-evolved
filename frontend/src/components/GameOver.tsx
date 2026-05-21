import { useState } from 'react';
import { Difficulty } from '../game/difficulty';
import { MapName, MAP_LIST } from '../maps';
import { addHighScore } from '../highscores';

interface GameResult {
  won: boolean;
  score: number;
  timeSeconds: number;
  mapName: MapName;
  difficulty: Difficulty;
}

interface GameOverProps {
  result: GameResult;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export function GameOver({ result, onPlayAgain, onBackToMenu }: GameOverProps) {
  const [playerName, setPlayerName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const mapLabel = MAP_LIST.find((m) => m.name === result.mapName)?.label ?? result.mapName;
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    if (!playerName.trim()) return;
    setSubmitting(true);
    try {
      addHighScore({
        playerName: playerName.trim(),
        mapName: result.mapName,
        difficulty: result.difficulty,
        score: result.score,
        timeSeconds: result.timeSeconds,
      });
      setSubmitted(true);
    } catch {
      setError('Could not save score.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {result.won ? (
          <>
            <h1 style={styles.titleWin}>🎉 Victory!</h1>
            <p style={styles.subtitle}>You cleared {mapLabel}!</p>
          </>
        ) : (
          <>
            <h1 style={styles.titleLose}>💥 Game Over</h1>
            <p style={styles.subtitle}>A mine exploded on {mapLabel}</p>
          </>
        )}

        <div style={styles.stats}>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Score</span>
            <span style={styles.statValue}>{result.score}</span>
          </div>
          <div style={styles.statItem}>
            <span style={styles.statLabel}>Time</span>
            <span style={styles.statValue}>{formatTime(result.timeSeconds)}</span>
          </div>
        </div>

        {result.won && !submitted && (
          <div style={styles.submitSection}>
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.slice(0, 30))}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              style={styles.input}
              maxLength={30}
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !playerName.trim()}
              style={styles.submitBtn}
            >
              {submitting ? 'Submitting...' : 'Submit Score'}
            </button>
            {error && <p style={styles.error}>{error}</p>}
          </div>
        )}

        {submitted && <p style={styles.success}>✓ Score submitted!</p>}

        <div style={styles.buttonRow}>
          <button onClick={onPlayAgain} style={styles.actionBtn}>Play Again</button>
          <button onClick={onBackToMenu} style={styles.actionBtnSecondary}>Main Menu</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(10, 22, 40, 0.92)',
    zIndex: 100,
  },
  modal: {
    background: '#0f2840',
    border: '2px solid #2a4a6a',
    borderRadius: '16px',
    padding: '2.5rem',
    textAlign: 'center' as const,
    maxWidth: '420px',
    width: '90%',
  },
  titleWin: {
    fontSize: '2.5rem',
    margin: 0,
    color: '#66bb6a',
  },
  titleLose: {
    fontSize: '2.5rem',
    margin: 0,
    color: '#ef5350',
  },
  subtitle: {
    color: '#8899aa',
    marginTop: '0.5rem',
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '3rem',
    margin: '1.5rem 0',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  statLabel: {
    fontSize: '0.85rem',
    color: '#8899aa',
  },
  statValue: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#e0e8f0',
  },
  submitSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    margin: '1rem 0',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '2px solid #2a4a6a',
    borderRadius: '8px',
    background: '#0a1628',
    color: '#e0e8f0',
    fontSize: '1rem',
    outline: 'none',
  },
  submitBtn: {
    padding: '0.75rem',
    border: 'none',
    borderRadius: '8px',
    background: '#4fc3f7',
    color: '#0a1628',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
  },
  error: {
    color: '#ef5350',
    fontSize: '0.85rem',
  },
  success: {
    color: '#66bb6a',
    fontSize: '1rem',
    margin: '1rem 0',
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
    marginTop: '1.5rem',
  },
  actionBtn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #4fc3f7, #0288d1)',
    color: '#fff',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '0.75rem 1.5rem',
    border: '2px solid #4fc3f7',
    borderRadius: '10px',
    background: 'transparent',
    color: '#4fc3f7',
    cursor: 'pointer',
  },
};
