import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameScreen } from './components/GameScreen';
import { HighScores } from './components/HighScores';
import { GameOver } from './components/GameOver';
import { Difficulty } from './game/difficulty';
import { MapName } from './maps';

type Screen = 'menu' | 'game' | 'gameover' | 'highscores';

interface GameResult {
  won: boolean;
  score: number;
  timeSeconds: number;
  mapName: MapName;
  difficulty: Difficulty;
}

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedMap, setSelectedMap] = useState<MapName>('hormuz');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const handleStartGame = (map: MapName, difficulty: Difficulty) => {
    setSelectedMap(map);
    setSelectedDifficulty(difficulty);
    setScreen('game');
  };

  const handleGameOver = (won: boolean, score: number, timeSeconds: number) => {
    setGameResult({ won, score, timeSeconds, mapName: selectedMap, difficulty: selectedDifficulty });
    setScreen('gameover');
  };

  const handleBackToMenu = () => {
    setScreen('menu');
  };

  return (
    <div style={{ width: '100%', height: '100%' }}>
      {screen === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onShowHighScores={() => setScreen('highscores')}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          mapName={selectedMap}
          difficulty={selectedDifficulty}
          onGameOver={handleGameOver}
          onBackToMenu={handleBackToMenu}
        />
      )}
      {screen === 'gameover' && gameResult && (
        <GameOver
          result={gameResult}
          onPlayAgain={() => setScreen('game')}
          onBackToMenu={handleBackToMenu}
        />
      )}
      {screen === 'highscores' && (
        <HighScores onBack={handleBackToMenu} />
      )}
    </div>
  );
}

export default App;
