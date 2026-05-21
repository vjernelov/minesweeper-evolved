import { Difficulty, DIFFICULTIES } from '../game/difficulty';
import { MapName, MAP_LIST } from '../maps';
import { soundManager } from '../audio/SoundManager';
import { useState } from 'react';

interface GameHUDProps {
  elapsed: number;
  minesRemaining: number;
  mapName: MapName;
  difficulty: Difficulty;
  onBackToMenu: () => void;
}

export function GameHUD({ elapsed, minesRemaining, mapName, difficulty, onBackToMenu }: GameHUDProps) {
  const [muted, setMuted] = useState(soundManager.isMuted());
  const mapLabel = MAP_LIST.find((m) => m.name === mapName)?.label ?? mapName;
  const diffLabel = DIFFICULTIES[difficulty].label;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleMuteToggle = () => {
    const nowMuted = soundManager.toggleMute();
    setMuted(nowMuted);
  };

  return (
    <div style={styles.container}>
      <div style={styles.left}>
        <button onClick={onBackToMenu} style={styles.menuBtn}>← Menu</button>
        <span style={styles.mapInfo}>{mapLabel} • {diffLabel}</span>
      </div>
      <div style={styles.center}>
        <span style={styles.stat}>⏱ {formatTime(elapsed)}</span>
        <span style={styles.stat}>💣 {minesRemaining}</span>
      </div>
      <div style={styles.right}>
        <button onClick={handleMuteToggle} style={styles.muteBtn}>
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 1rem',
    background: 'rgba(10, 22, 40, 0.9)',
    borderBottom: '1px solid #2a4a6a',
    zIndex: 10,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  center: {
    display: 'flex',
    gap: '2rem',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
  },
  menuBtn: {
    padding: '0.4rem 0.8rem',
    border: '1px solid #4fc3f7',
    borderRadius: '6px',
    background: 'transparent',
    color: '#4fc3f7',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
  mapInfo: {
    color: '#8899aa',
    fontSize: '0.9rem',
  },
  stat: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    color: '#e0e8f0',
  },
  muteBtn: {
    padding: '0.4rem',
    border: 'none',
    background: 'transparent',
    fontSize: '1.3rem',
    cursor: 'pointer',
  },
};
