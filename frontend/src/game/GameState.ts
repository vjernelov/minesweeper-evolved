import { Difficulty, DIFFICULTIES } from './difficulty';

export const BOARD_SIZE = 64;

export interface Cell {
  isMine: boolean;
  isLand: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  board: Cell[][];
  status: GameStatus;
  minesPlaced: boolean;
  totalMines: number;
  flagCount: number;
  revealedCount: number;
  totalSeaTiles: number;
  startTime: number | null;
  endTime: number | null;
}

export function createInitialState(landMap: boolean[][], difficulty: Difficulty): GameState {
  const config = DIFFICULTIES[difficulty];
  const board: Cell[][] = [];
  let totalSeaTiles = 0;

  for (let y = 0; y < BOARD_SIZE; y++) {
    board[y] = [];
    for (let x = 0; x < BOARD_SIZE; x++) {
      const isLand = landMap[y]?.[x] ?? false;
      if (!isLand) totalSeaTiles++;
      board[y][x] = {
        isMine: false,
        isLand,
        isRevealed: isLand, // Land tiles start revealed
        isFlagged: false,
        adjacentMines: 0,
      };
    }
  }

  return {
    board,
    status: 'playing',
    minesPlaced: false,
    totalMines: Math.min(config.mineCount, totalSeaTiles - 9), // Leave room for first click area
    flagCount: 0,
    revealedCount: 0,
    totalSeaTiles,
    startTime: null,
    endTime: null,
  };
}

function getNeighbors(x: number, y: number): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE) {
        neighbors.push([nx, ny]);
      }
    }
  }
  return neighbors;
}

function placeMines(state: GameState, safeX: number, safeY: number): void {
  const { board, totalMines } = state;

  // Collect all valid sea cells that aren't in the safe zone
  const candidates: [number, number][] = [];
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].isLand) continue;
      // Exclude the clicked cell and its neighbors
      if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;
      candidates.push([x, y]);
    }
  }

  // Shuffle and pick mines
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const minePositions = candidates.slice(0, totalMines);
  for (const [mx, my] of minePositions) {
    board[my][mx].isMine = true;
  }

  // Calculate adjacent mine counts for all cells
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x].isMine || board[y][x].isLand) continue;
      let count = 0;
      for (const [nx, ny] of getNeighbors(x, y)) {
        if (board[ny][nx].isMine) count++;
      }
      board[y][x].adjacentMines = count;
    }
  }

  state.minesPlaced = true;
}

export function revealCell(state: GameState, x: number, y: number): GameState {
  if (state.status !== 'playing') return state;

  const cell = state.board[y]?.[x];
  if (!cell || cell.isLand || cell.isRevealed || cell.isFlagged) return state;

  // First click — place mines
  if (!state.minesPlaced) {
    placeMines(state, x, y);
    state.startTime = Date.now();
  }

  // Hit a mine
  if (cell.isMine) {
    cell.isRevealed = true;
    state.status = 'lost';
    state.endTime = Date.now();
    // Reveal all mines
    for (let ry = 0; ry < BOARD_SIZE; ry++) {
      for (let rx = 0; rx < BOARD_SIZE; rx++) {
        if (state.board[ry][rx].isMine) {
          state.board[ry][rx].isRevealed = true;
        }
      }
    }
    return state;
  }

  // Flood-fill reveal
  const stack: [number, number][] = [[x, y]];
  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const c = state.board[cy][cx];
    if (c.isRevealed || c.isLand || c.isFlagged) continue;

    c.isRevealed = true;
    state.revealedCount++;

    // If zero adjacent mines, reveal neighbors too
    if (c.adjacentMines === 0) {
      for (const [nx, ny] of getNeighbors(cx, cy)) {
        const neighbor = state.board[ny][nx];
        if (!neighbor.isRevealed && !neighbor.isLand && !neighbor.isMine) {
          stack.push([nx, ny]);
        }
      }
    }
  }

  // Check win condition: all non-mine sea tiles revealed
  if (state.revealedCount === state.totalSeaTiles - state.totalMines) {
    state.status = 'won';
    state.endTime = Date.now();
  }

  return state;
}

export function toggleFlag(state: GameState, x: number, y: number): GameState {
  if (state.status !== 'playing') return state;

  const cell = state.board[y]?.[x];
  if (!cell || cell.isLand || cell.isRevealed) return state;

  if (cell.isFlagged) {
    cell.isFlagged = false;
    state.flagCount--;
  } else {
    cell.isFlagged = true;
    state.flagCount++;
  }

  return state;
}

export function getScore(state: GameState): number {
  // Each correctly flagged mine or revealed safe tile contributes to score
  // Score = mines found × 50 (flagged mines that are actually mines)
  let correctFlags = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const cell = state.board[y][x];
      if (cell.isFlagged && cell.isMine) correctFlags++;
    }
  }
  return correctFlags * 50;
}

export function getElapsedSeconds(state: GameState): number {
  if (!state.startTime) return 0;
  const end = state.endTime ?? Date.now();
  return Math.floor((end - state.startTime) / 1000);
}
