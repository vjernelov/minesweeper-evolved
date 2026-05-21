import { Cell, BOARD_SIZE, GameState } from '../game/GameState';
import { MapName } from '../maps';
import { updateAndDrawAnimations } from './MapAnimations';

const TILE_SIZE = 32;

// Ocean/nautical color theme
const COLORS = {
  unrevealed: '#1a3a5c',
  unrevealedHover: '#254a6e',
  revealed: '#c8dce8',
  land: '#8fbc6b',
  landDark: '#6b9c4f',
  flagged: '#1a3a5c',
  mine: '#ff4444',
  grid: '#0f2840',
  numbers: ['', '#4fc3f7', '#66bb6a', '#ef5350', '#ab47bc', '#ff7043', '#26c6da', '#78909c', '#bdbdbd'],
};

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  camera: Camera;
  hoverX: number;
  hoverY: number;
  mapName: MapName;
  timestamp: number;
}

export function createCamera(): Camera {
  return { x: 0, y: 0, zoom: 1 };
}

export function screenToBoard(screenX: number, screenY: number, camera: Camera, canvas: HTMLCanvasElement): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const canvasX = screenX - rect.left;
  const canvasY = screenY - rect.top;

  const worldX = (canvasX / camera.zoom) + camera.x;
  const worldY = (canvasY / camera.zoom) + camera.y;

  const boardX = Math.floor(worldX / TILE_SIZE);
  const boardY = Math.floor(worldY / TILE_SIZE);

  return [boardX, boardY];
}

export function renderGame(rc: RenderContext, state: GameState): void {
  const { ctx, canvas, camera, hoverX, hoverY } = rc;

  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.scale(camera.zoom, camera.zoom);
  ctx.translate(-camera.x, -camera.y);

  // Calculate visible tile range
  const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
  const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
  const endCol = Math.min(BOARD_SIZE, Math.ceil((camera.x + canvas.width / camera.zoom) / TILE_SIZE));
  const endRow = Math.min(BOARD_SIZE, Math.ceil((camera.y + canvas.height / camera.zoom) / TILE_SIZE));

  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      const cell = state.board[y][x];
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;

      drawTile(ctx, cell, px, py, x, y, x === hoverX && y === hoverY, state.status, rc.timestamp);
    }
  }

  // Draw coastline borders — stroke only on edges where land meets sea
  ctx.beginPath();
  ctx.strokeStyle = '#4a7a30';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'square';
  for (let y = startRow; y < endRow; y++) {
    for (let x = startCol; x < endCol; x++) {
      if (!state.board[y][x].isLand) continue;
      const px = x * TILE_SIZE;
      const py = y * TILE_SIZE;
      if (y === 0 || !state.board[y - 1][x].isLand) { ctx.moveTo(px, py); ctx.lineTo(px + TILE_SIZE, py); }
      if (x === BOARD_SIZE - 1 || !state.board[y][x + 1].isLand) { ctx.moveTo(px + TILE_SIZE, py); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE); }
      if (y === BOARD_SIZE - 1 || !state.board[y + 1][x].isLand) { ctx.moveTo(px, py + TILE_SIZE); ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE); }
      if (x === 0 || !state.board[y][x - 1].isLand) { ctx.moveTo(px, py); ctx.lineTo(px, py + TILE_SIZE); }
    }
  }
  ctx.stroke();

  updateAndDrawAnimations(ctx, camera, canvas, rc.mapName, rc.timestamp);

  ctx.restore();

  // Draw minimap
  drawMinimap(ctx, canvas, state, camera);
}

function landNoise(bx: number, by: number): number {
  const n = Math.sin(bx * 127.1 + by * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function drawTile(ctx: CanvasRenderingContext2D, cell: Cell, px: number, py: number, bx: number, by: number, isHover: boolean, _status: string, timestamp: number): void {
  const size = TILE_SIZE;
  const padding = 1;

  if (cell.isLand) {
    // Land tile — full size (no padding) so adjacent tiles merge seamlessly
    const noise = landNoise(bx, by);
    const darken = isHover ? 0.82 : 1;
    const r = Math.round((107 + noise * 56) * darken);
    const g = Math.round((156 + noise * 52) * darken);
    const b = Math.round((79 + noise * 48) * darken);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(px, py, size, size);
  } else if (!cell.isRevealed) {
    if (cell.isFlagged) {
      // Flagged tile
      ctx.fillStyle = COLORS.flagged;
      ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
      // Draw flag
      drawFlag(ctx, px, py, size);
    } else {
      // Unrevealed sea tile — animated rolling waves
      ctx.fillStyle = isHover ? COLORS.unrevealedHover : COLORS.unrevealed;
      ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
      const t = timestamp * 0.0018;
      const waveY1 = Math.sin(px * 0.13 + t) * 2.5;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + 5, py + size / 2 + waveY1);
      ctx.quadraticCurveTo(px + size / 2, py + size / 2 - 3 + waveY1, px + size - 5, py + size / 2 + waveY1);
      ctx.stroke();
      const waveY2 = Math.sin(px * 0.13 + t + 1.6) * 1.8;
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.moveTo(px + 5, py + size * 0.68 + waveY2);
      ctx.quadraticCurveTo(px + size / 2, py + size * 0.68 - 2 + waveY2, px + size - 5, py + size * 0.68 + waveY2);
      ctx.stroke();
    }
  } else if (cell.isMine) {
    // Revealed mine
    ctx.fillStyle = COLORS.mine;
    ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
    // Draw mine symbol
    drawMine(ctx, px, py, size);
  } else {
    // Revealed safe sea tile — subtle animated shimmer
    ctx.fillStyle = COLORS.revealed;
    ctx.fillRect(px + padding, py + padding, size - padding * 2, size - padding * 2);
    const shimmer = 0.5 + 0.5 * Math.sin(px * 0.05 + py * 0.07 + timestamp * 0.0008);
    ctx.fillStyle = `rgba(180, 220, 255, ${(0.04 + shimmer * 0.06).toFixed(3)})`;
    ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

    if (cell.adjacentMines > 0) {
      drawNumber(ctx, cell.adjacentMines, px, py, size);
    }
  }
}

function drawNumber(ctx: CanvasRenderingContext2D, num: number, px: number, py: number, size: number): void {
  ctx.fillStyle = COLORS.numbers[num] || '#fff';
  ctx.font = `bold ${size * 0.55}px 'Segoe UI', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(num), px + size / 2, py + size / 2 + 1);
}

function drawFlag(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
  const cx = px + size / 2;
  const cy = py + size / 2;
  // Pole
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx, cy + 8);
  ctx.stroke();
  // Flag triangle
  ctx.fillStyle = '#ff6b35';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 8);
  ctx.lineTo(cx + 8, cy - 4);
  ctx.lineTo(cx, cy);
  ctx.closePath();
  ctx.fill();
}

function drawMine(ctx: CanvasRenderingContext2D, px: number, py: number, size: number): void {
  const cx = px + size / 2;
  const cy = py + size / 2;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Spikes
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 4, cy + Math.sin(angle) * 4);
    ctx.lineTo(cx + Math.cos(angle) * 10, cy + Math.sin(angle) * 10);
    ctx.stroke();
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: GameState, camera: Camera): void {
  const mmSize = 128;
  const mmX = canvas.width - mmSize - 10;
  const mmY = 10;
  const cellSize = mmSize / BOARD_SIZE;

  // Background
  ctx.fillStyle = 'rgba(10, 22, 40, 0.85)';
  ctx.fillRect(mmX - 2, mmY - 2, mmSize + 4, mmSize + 4);

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = state.board[y][x];
      if (cell.isLand) {
        ctx.fillStyle = '#6b9c4f';
      } else if (cell.isRevealed) {
        ctx.fillStyle = cell.isMine ? '#ff4444' : '#8ab4cc';
      } else if (cell.isFlagged) {
        ctx.fillStyle = '#ff6b35';
      } else {
        ctx.fillStyle = '#1a3a5c';
      }
      ctx.fillRect(mmX + x * cellSize, mmY + y * cellSize, cellSize, cellSize);
    }
  }

  // Viewport rectangle
  const vpX = mmX + (camera.x / (BOARD_SIZE * TILE_SIZE)) * mmSize;
  const vpY = mmY + (camera.y / (BOARD_SIZE * TILE_SIZE)) * mmSize;
  const vpW = (canvas.width / camera.zoom / (BOARD_SIZE * TILE_SIZE)) * mmSize;
  const vpH = (canvas.height / camera.zoom / (BOARD_SIZE * TILE_SIZE)) * mmSize;

  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(vpX, vpY, vpW, vpH);
}
