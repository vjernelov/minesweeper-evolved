import { useState } from 'react';
import { Difficulty, DIFFICULTIES } from '../game/difficulty';
import { MapName, MAP_LIST } from '../maps';

interface MainMenuProps {
  onStartGame: (map: MapName, difficulty: Difficulty) => void;
  onShowHighScores: () => void;
}

export function MainMenu({ onStartGame, onShowHighScores }: MainMenuProps) {
  const [selectedMap, setSelectedMap] = useState<MapName>('hormuz');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>🌊 Minesweeper Evolved</h1>
      <p style={styles.subtitle}>Navigate the world&apos;s most dangerous straits</p>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Select Map</h2>
        <div style={styles.mapGrid}>
          {MAP_LIST.map((map) => (
            <button
              key={map.name}
              onClick={() => setSelectedMap(map.name)}
              style={{
                ...styles.mapCard,
                ...(selectedMap === map.name ? styles.mapCardSelected : {}),
              }}
            >
              <div style={styles.mapLabel}>{map.label}</div>
              <div style={styles.mapDesc}>{map.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Difficulty</h2>
        <div style={styles.difficultyRow}>
          {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES.easy][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedDifficulty(key)}
              style={{
                ...styles.diffBtn,
                ...(selectedDifficulty === key ? styles.diffBtnSelected : {}),
              }}
            >
              <div>{config.label}</div>
              <div style={styles.mineCount}>{config.mineCount} mines</div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.buttonRow}>
        <button onClick={() => onStartGame(selectedMap, selectedDifficulty)} style={styles.startBtn}>
          Start Game
        </button>
        <button onClick={onShowHighScores} style={styles.scoresBtn}>
          High Scores
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: '2rem',
    gap: '1.5rem',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #4fc3f7, #26c6da)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: 0,
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#8899aa',
    marginTop: '-0.5rem',
  },
  section: {
    width: '100%',
    maxWidth: '600px',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    color: '#66bbcc',
    marginBottom: '0.75rem',
  },
  mapGrid: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  mapCard: {
    flex: '1 1 160px',
    padding: '1rem',
    border: '2px solid #2a4a6a',
    borderRadius: '12px',
    background: '#0f2840',
    cursor: 'pointer',
    textAlign: 'left' as const,
    color: '#c8dce8',
    transition: 'all 0.2s',
  },
  mapCardSelected: {
    borderColor: '#4fc3f7',
    background: '#1a3a5c',
    boxShadow: '0 0 12px rgba(79, 195, 247, 0.3)',
  },
  mapLabel: {
    fontWeight: 'bold',
    fontSize: '1rem',
    marginBottom: '0.25rem',
  },
  mapDesc: {
    fontSize: '0.8rem',
    color: '#8899aa',
  },
  difficultyRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  diffBtn: {
    flex: 1,
    padding: '0.75rem',
    border: '2px solid #2a4a6a',
    borderRadius: '10px',
    background: '#0f2840',
    cursor: 'pointer',
    color: '#c8dce8',
    textAlign: 'center' as const,
    transition: 'all 0.2s',
  },
  diffBtnSelected: {
    borderColor: '#66bb6a',
    background: '#1a3a3c',
    boxShadow: '0 0 12px rgba(102, 187, 106, 0.3)',
  },
  mineCount: {
    fontSize: '0.75rem',
    color: '#8899aa',
    marginTop: '0.25rem',
  },
  buttonRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  startBtn: {
    padding: '1rem 2.5rem',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4fc3f7, #0288d1)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'transform 0.1s',
  },
  scoresBtn: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    border: '2px solid #4fc3f7',
    borderRadius: '12px',
    background: 'transparent',
    color: '#4fc3f7',
    cursor: 'pointer',
  },
};
