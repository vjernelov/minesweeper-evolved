import { useRef, useEffect, useState, useCallback } from 'react';
import { Difficulty } from '../game/difficulty';
import { MapName, getMapData } from '../maps';
import {
  GameState,
  createInitialState,
  revealCell,
  toggleFlag,
  getScore,
  getElapsedSeconds,
  BOARD_SIZE,
} from '../game/GameState';
import {
  Camera,
  createCamera,
  screenToBoard,
  renderGame,
  RenderContext,
} from '../renderer/CanvasRenderer';
import { soundManager } from '../audio/SoundManager';
import { GameHUD } from './GameHUD';

interface GameScreenProps {
  mapName: MapName;
  difficulty: Difficulty;
  onGameOver: (won: boolean, score: number, timeSeconds: number) => void;
  onBackToMenu: () => void;
}

export function GameScreen({ mapName, difficulty, onGameOver, onBackToMenu }: GameScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState | null>(null);
  const cameraRef = useRef<Camera>(createCamera());
  const hoverRef = useRef<{ x: number; y: number }>({ x: -1, y: -1 });
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const gameOverFiredRef = useRef(false);

  // Initialize game
  useEffect(() => {
    const landMap = getMapData(mapName);
    gameStateRef.current = createInitialState(landMap, difficulty);
    gameOverFiredRef.current = false;
    forceUpdate((n) => n + 1);
  }, [mapName, difficulty]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameStateRef.current) {
        setElapsed(getElapsedSeconds(gameStateRef.current));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;

      if (gameStateRef.current) {
        const rc: RenderContext = {
          canvas,
          ctx,
          camera: cameraRef.current,
          hoverX: hoverRef.current.x,
          hoverY: hoverRef.current.y,
          mapName,
          timestamp,
        };
        renderGame(rc, gameStateRef.current);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = false;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Update hover position
    const [bx, by] = screenToBoard(e.clientX, e.clientY, cameraRef.current, canvas);
    hoverRef.current = { x: bx, y: by };

    // Pan with left button held
    if (e.buttons & 1) {
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        isDraggingRef.current = true;
      }
      cameraRef.current.x -= dx / cameraRef.current.zoom;
      cameraRef.current.y -= dy / cameraRef.current.zoom;
      clampCamera(canvas);
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const state = gameStateRef.current;
    if (!canvas || !state || state.status !== 'playing') return;

    if (e.button === 0 && !isDraggingRef.current) {
      // Left click — reveal
      const [bx, by] = screenToBoard(e.clientX, e.clientY, cameraRef.current, canvas);
      if (bx >= 0 && bx < BOARD_SIZE && by >= 0 && by < BOARD_SIZE) {
        const cell = state.board[by][bx];
        if (!cell.isLand && !cell.isRevealed && !cell.isFlagged) {
          soundManager.play('click');
          revealCell(state, bx, by);
          checkGameEnd(state);
          forceUpdate((n) => n + 1);
        }
      }
    }
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const state = gameStateRef.current;
    if (!canvas || !state || state.status !== 'playing') return;

    const [bx, by] = screenToBoard(e.clientX, e.clientY, cameraRef.current, canvas);
    if (bx >= 0 && bx < BOARD_SIZE && by >= 0 && by < BOARD_SIZE) {
      const cell = state.board[by][bx];
      if (!cell.isLand && !cell.isRevealed) {
        soundManager.play(cell.isFlagged ? 'unflag' : 'flag');
        toggleFlag(state, bx, by);
        forceUpdate((n) => n + 1);
      }
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.max(0.3, Math.min(4, cameraRef.current.zoom * zoomFactor));

    // Zoom toward mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldX = mouseX / cameraRef.current.zoom + cameraRef.current.x;
    const worldY = mouseY / cameraRef.current.zoom + cameraRef.current.y;

    cameraRef.current.zoom = newZoom;
    cameraRef.current.x = worldX - mouseX / newZoom;
    cameraRef.current.y = worldY - mouseY / newZoom;

    clampCamera(canvas);
  }, []);

  const checkGameEnd = (state: GameState) => {
    if (gameOverFiredRef.current) return;
    if (state.status === 'won') {
      gameOverFiredRef.current = true;
      soundManager.play('victory');
      setTimeout(() => onGameOver(true, getScore(state), getElapsedSeconds(state)), 500);
    } else if (state.status === 'lost') {
      gameOverFiredRef.current = true;
      soundManager.play('explosion');
      setTimeout(() => onGameOver(false, getScore(state), getElapsedSeconds(state)), 1000);
    }
  };

  const clampCamera = (canvas: HTMLCanvasElement) => {
    const maxX = BOARD_SIZE * 32 - canvas.width / cameraRef.current.zoom;
    const maxY = BOARD_SIZE * 32 - canvas.height / cameraRef.current.zoom;
    cameraRef.current.x = Math.max(0, Math.min(maxX, cameraRef.current.x));
    cameraRef.current.y = Math.max(0, Math.min(maxY, cameraRef.current.y));
  };

  const state = gameStateRef.current;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <GameHUD
        elapsed={elapsed}
        minesRemaining={state ? state.totalMines - state.flagCount : 0}
        mapName={mapName}
        difficulty={difficulty}
        onBackToMenu={onBackToMenu}
      />
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
      />
    </div>
  );
}
