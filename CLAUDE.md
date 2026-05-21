
# Minesweeper Evolved 

This project is a web based version of the old classic Minesweeper game that was included in older Microsoft Windows editions. It's a new, fresh, funny take on the old Minesweeper game with updated graphics inspired by games like Candy Crush. The game has three maps inspired by the actual geographical sites of the Straight of Hormuz, the Öresund Straight and the Gulf of Mexico. The board will thus have non-mined, land areas included in them.

All maps are 64x64 tiles. Main game flow is that the user is presented with a map of undiscovered sea tiles and exposed land tiles that visually are different from the sea tiles. The user then tries to identify the tiles that contain mines by looking at the discovered adjacent tiles and their numbers. Each number indicates how many of the adjacent tiles that have a mine. Based on these numbers the challenge for the user is to deduce which other fields are mined, flag them and thus revealing the full map. If the player exposes a tile that contains a mine the mine explodes and the game is over.

High scores are set by number of mines discovered (50 points each). Time spent on the map is the secondary metric for deciding the high score list, so two players with equal scores get rangked based on the shortest time spent on the map.

## Architecture

### Backend

The backend is built with **TypeScript + Express.js** and runs on `http://localhost:3001`. Its sole responsibility is persisting and serving high scores.

- **Entry point**: `backend/src/index.ts`
- **Storage**: `backend/data/highscores.json` — a plain JSON file, no database required
- **API**:
  - `GET /api/highscores?map=&difficulty=` — returns scores sorted by score (desc) then time (asc)
  - `POST /api/highscores` — validates and appends a new score entry
- **Fields per entry**: `playerName`, `mapName`, `difficulty`, `score`, `timeSeconds`, `date`
- Run locally with `ts-node` for development

### Frontend

The frontend is built with **React + TypeScript**, bundled by **Vite**, and runs on `http://localhost:3000`. Vite proxies all `/api` requests to the backend so no CORS issues arise in development.

#### Rendering

The 64×64 tile grid is rendered on an **HTML Canvas** element. Canvas was chosen over CSS Grid because it handles 4096 tiles with smooth animations at high performance. Only the tiles visible within the current viewport are drawn each frame (frustum culling).

The camera supports:
- **Pan**: left-click drag
- **Zoom**: scroll wheel, zooming toward the mouse position
- **Minimap**: always-visible overview in the top-right corner

#### Game Logic

Core game state lives in `frontend/src/game/GameState.ts`:

- The board is a 64×64 array of `Cell` objects: `{ isMine, isLand, isRevealed, isFlagged, adjacentMines }`
- **Land tiles** are pre-revealed and can never be mined
- **First-click safety**: mines are placed *after* the player's first click, guaranteeing the clicked cell and its 8 neighbors are always safe
- **Flood-fill reveal**: clicking a cell with zero adjacent mines automatically reveals all connected zero-mine cells
- **Win condition**: all non-mine sea tiles revealed
- **Scoring**: each correctly flagged mine = 50 points; time is the tiebreaker

#### Maps

The three maps are generated procedurally at runtime in `frontend/src/maps/index.ts` using rectangles, ellipses, and pseudo-random coastline noise. They are loosely inspired by the real geography:

| Map | Description |
|-----|-------------|
| Strait of Hormuz | Iran landmass top, Oman bottom-right, narrow sea channel between |
| Öresund | Denmark on the left, Sweden on the right, vertical strait |
| Gulf of Mexico | USA top, Mexico left + Yucatan peninsula, Cuba island, open Gulf water |

#### Difficulty

| Level | Mines |
|-------|-------|
| Easy | 200 |
| Normal | 400 |
| Expert | 600 |

#### Sound

Sound effects are synthesized entirely with the **Web Audio API** — no audio files needed. A singleton `SoundManager` provides: click, reveal, flag, unflag, explosion, and a victory jingle. The HUD has a mute toggle.

#### UI Flow

```
Main Menu → Game Screen → Game Over overlay → (submit score) → High Scores
```

Screen state is managed in `App.tsx`. The Game Over overlay shows name entry and score submission on a win, and a retry/menu option on a loss. If the backend is unavailable, the high scores screen shows a graceful error.

## Deployment

The application is hosted locally only. Start both services with a single command from the project root:

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

See [PLAN.md](PLAN.md) for the full implementation plan and file structure.

## Project Status

The state of the project is reflected in `PLAN.md`.
