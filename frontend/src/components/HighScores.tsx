import { useEffect, useState } from 'react';
import { Difficulty, DIFFICULTIES } from '../game/difficulty';
import { MapName, MAP_LIST } from '../maps';

interface HighScoreEntry {
  playerName: string;
  mapName: string;
  difficulty: string;
  score: number;
  timeSeconds: number;
  date: string;
}

interface HighScoresProps {
  onBack: () => void;
}

export function HighScores({ onBack }: HighScoresProps) {
  const [scores, setScores] = useState<HighScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMap, setFilterMap] = useState<MapName | ''>('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | ''>('');

  useEffect(() => {
    fetchScores();
  }, [filterMap, filterDifficulty]);

  const fetchScores = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterMap) params.set('map', filterMap);
      if (filterDifficulty) params.set('difficulty', filterDifficulty);
      const res = await fetch(`/api/highscores?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setScores(data);
    } catch {
      setError('Could not load high scores. Backend may be unavailable.');
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← Back</button>
        <h1 style={styles.title}>🏆 Hall of Fame</h1>
      </div>

      <div style={styles.filters}>
        <select
          value={filterMap}
          onChange={(e) => setFilterMap(e.target.value as MapName | '')}
          style={styles.select}
        >
          <option value="">All Maps</option>
          {MAP_LIST.map((m) => (
            <option key={m.name} value={m.name}>{m.label}</option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value as Difficulty | '')}
          style={styles.select}
        >
          <option value="">All Difficulties</option>
          {(Object.entries(DIFFICULTIES) as [Difficulty, typeof DIFFICULTIES.easy][]).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {loading && <p style={styles.message}>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && !error && scores.length === 0 && (
        <p style={styles.message}>No scores yet. Be the first!</p>
      )}

      {scores.length > 0 && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>#</th>
                <th style={styles.th}>Player</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Map</th>
                <th style={styles.th}>Difficulty</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {scores.slice(0, 20).map((entry, i) => (
                <tr key={i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.tdName}>{entry.playerName}</td>
                  <td style={styles.td}>{entry.score}</td>
                  <td style={styles.td}>{formatTime(entry.timeSeconds)}</td>
                  <td style={styles.td}>
                    {MAP_LIST.find((m) => m.name === entry.mapName)?.label ?? entry.mapName}
                  </td>
                  <td style={styles.td}>
                    {DIFFICULTIES[entry.difficulty as Difficulty]?.label ?? entry.difficulty}
                  </td>
                  <td style={styles.td}>{formatDate(entry.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '2rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  backBtn: {
    padding: '0.5rem 1rem',
    border: '1px solid #4fc3f7',
    borderRadius: '8px',
    background: 'transparent',
    color: '#4fc3f7',
    cursor: 'pointer',
  },
  title: {
    fontSize: '2rem',
    color: '#ffd54f',
    margin: 0,
  },
  filters: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
  },
  select: {
    padding: '0.5rem 1rem',
    border: '1px solid #2a4a6a',
    borderRadius: '8px',
    background: '#0f2840',
    color: '#e0e8f0',
    fontSize: '0.9rem',
  },
  message: {
    color: '#8899aa',
    fontSize: '1.1rem',
    textAlign: 'center' as const,
    marginTop: '3rem',
  },
  error: {
    color: '#ef5350',
    textAlign: 'center' as const,
    marginTop: '2rem',
  },
  tableContainer: {
    overflowY: 'auto',
    flex: 1,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '0.75rem 1rem',
    textAlign: 'left' as const,
    borderBottom: '2px solid #2a4a6a',
    color: '#66bbcc',
    fontSize: '0.85rem',
    textTransform: 'uppercase' as const,
  },
  td: {
    padding: '0.6rem 1rem',
    color: '#c8dce8',
  },
  tdName: {
    padding: '0.6rem 1rem',
    color: '#fff',
    fontWeight: 'bold',
  },
  rowEven: {
    background: 'rgba(15, 40, 64, 0.5)',
  },
  rowOdd: {
    background: 'transparent',
  },
};
