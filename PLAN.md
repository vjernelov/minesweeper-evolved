# Plan: Minesweeper Evolved

Build a web-based Minesweeper game with ocean-themed visuals, three geographical maps, configurable difficulty, and a local high-score system.

## Key Decisions

- **Frontend**: React + TypeScript (matches backend language, good state management for game logic)
- **Rendering**: HTML Canvas for the 64x64 tile grid (performance with 4096 tiles + animations)
- **Backend**: TypeScript + Express.js (lightweight REST API for high scores)
- **Maps**: Generated procedurally in code, loosely inspired by real coastlines
- **Tile style**: Ocean/nautical theme (wave patterns, flag icons, mine symbols)
- **Animations**: Bright colors, smooth reveal animations, particle effects on flag/explosion
- **Sound**: Synthesized via Web Audio API — click, reveal, flag, explosion, victory jingle
- **Mine counts**: Easy=200, Normal=400, Expert=600
- **First click**: Always safe (mines are placed after the first click, avoiding the clicked cell and its neighbors)
- **Flagging**: Right-click to flag
- **Player ID**: Name entry after a winning game, for high score submission
- **Storage**: JSON file on disk (`backend/data/highscores.json`)
- **Deployment**: Local only (localhost)

---

## Phase 1: Project Setup ✅

1. Initialize monorepo structure with `frontend/` and `backend/` directories
2. Set up **backend**: TypeScript + Express, with `ts-node` for local dev
   - Folder: `backend/src/`
   - Entry: `backend/src/index.ts`
   - Config: `backend/tsconfig.json`, `backend/package.json`
3. Set up **frontend**: React + TypeScript via Vite (fast dev server, simple config)
   - Folder: `frontend/src/`
   - Config: `frontend/tsconfig.json`, `frontend/package.json`, `frontend/vite.config.ts`
4. Add a root `package.json` with `npm run dev` to start both services together via `concurrently`

## Phase 2: Backend — High Score API ✅

5. Define high score data model:
   - Fields: `playerName`, `mapName`, `difficulty`, `score` (mines found × 50), `timeSeconds`, `date`
6. Create file-based storage module (`backend/src/storage.ts`)
   - Read/write `backend/data/highscores.json`
   - Functions: `getHighScores(mapName?, difficulty?)`, `addHighScore(entry)`
7. Create REST endpoints (`backend/src/routes/highscores.ts`):
   - `GET /api/highscores?map=&difficulty=` — returns sorted list (score desc, time asc)
   - `POST /api/highscores` — submit a new score (validates input)
8. Add CORS middleware so frontend can call backend

## Phase 3: Game Logic (Frontend) ✅

9. Create game state module (`frontend/src/game/GameState.ts`):
   - Board representation: 64x64 array of cells (`{ isMine, isLand, isRevealed, isFlagged, adjacentMines }`)
   - Mine placement after first click (safe zone = clicked cell + 8 neighbors)
   - Flood-fill reveal for zero-adjacent-mine cells
   - Win/lose detection
10. Create map data module (`frontend/src/maps/index.ts`):
    - Three maps generated procedurally using rectangles, ellipses, and coastline noise
    - `true` = land (always revealed, never mined), `false` = sea
    - Maps: Strait of Hormuz, Öresund, Gulf of Mexico
11. Difficulty configuration (`frontend/src/game/difficulty.ts`):
    - Easy/Normal/Expert with mine counts 200/400/600

## Phase 4: Rendering (Frontend — Canvas) ✅

12. Create Canvas renderer (`frontend/src/renderer/CanvasRenderer.ts`):
    - Draws only the visible tile range each frame (culling for performance)
    - Tile states: unrevealed sea (dark blue + wave), revealed sea (number/empty), land (green), flagged (flag icon), mine (explosion)
    - Number colors: 1=light blue, 2=green, 3=red, 4=purple, 5=orange, 6=cyan, 7=grey, 8=white
13. Implement viewport/camera:
    - Pan by left-click dragging
    - Zoom with scroll wheel (toward mouse position)
    - Minimap in top-right corner with viewport rectangle indicator
14. Add animations: (planned for future iteration)
    - Tile reveal ripple, bouncy flag, explosion particles, victory confetti

## Phase 5: UI & Game Flow (Frontend — React) ✅

15. Main menu screen (`frontend/src/components/MainMenu.tsx`):
    - Map selection (3 cards with name + description)
    - Difficulty selection (Easy/Normal/Expert with mine count shown)
    - "Start Game" and "High Scores" buttons
16. Game screen (`frontend/src/components/GameScreen.tsx`):
    - Hosts the canvas + handles all mouse events
    - Wires input events to game state mutations
17. Game HUD (`frontend/src/components/GameHUD.tsx`):
    - Live timer (counts up from first click), mines remaining counter, mute toggle
18. Game over overlay (`frontend/src/components/GameOver.tsx`):
    - Win: score + time display, name entry, submit to backend
    - Lose: explosion message + retry/menu options
    - Graceful error if backend is unavailable
19. High scores screen (`frontend/src/components/HighScores.tsx`):
    - Fetches from backend, shows top 20
    - Filter dropdowns for map and difficulty

## Phase 6: Sound ✅

20. Sound effects via Web Audio API (`frontend/src/audio/SoundManager.ts`):
    - Synthesized tones and noise — no external audio files needed
    - Sounds: click, reveal, flag, unflag, explosion, victory jingle
    - Singleton `soundManager` with mute toggle and volume control

## Phase 7: Map Creation ✅

21. Three 64x64 maps generated at runtime in `frontend/src/maps/index.ts`:
    - **Strait of Hormuz**: Iran landmass top, Oman bottom-right, narrow sea channel
    - **Öresund**: Denmark on left, Sweden on right, vertical sea strait
    - **Gulf of Mexico**: USA top, Mexico left, Yucatan peninsula, Cuba island, open Gulf water
    - Coastlines roughened with pseudo-random noise for a natural look

## Phase 8: Polish & Integration ✅

22. Full app flow wired in `App.tsx`: menu → game → gameover → highscores
23. Canvas auto-resizes to window dimensions each render frame
24. Backend errors handled gracefully — scores unavailable message shown
25. Vite proxy forwards `/api` requests to backend, avoiding CORS issues in dev

---

## File Structure

```
TeamDays2026/
├── CLAUDE.md
├── PLAN.md
├── package.json                (root: "npm run dev" starts both)
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── data/
│   │   └── highscores.json     (persistent score storage)
│   └── src/
│       ├── index.ts            (Express app, port 3001)
│       ├── storage.ts          (file-based score read/write)
│       └── routes/
│           └── highscores.ts   (GET + POST endpoints)
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts          (port 3000, /api proxied to 3001)
│   ├── index.html
│   └── src/
│       ├── main.tsx            (React entry point)
│       ├── App.tsx             (screen routing: menu/game/gameover/highscores)
│       ├── game/
│       │   ├── GameState.ts    (board logic, mine placement, flood-fill, scoring)
│       │   └── difficulty.ts   (Easy/Normal/Expert mine counts)
│       ├── maps/
│       │   └── index.ts        (procedural map generation for all 3 maps)
│       ├── renderer/
│       │   └── CanvasRenderer.ts  (tile drawing, camera, minimap)
│       ├── audio/
│       │   └── SoundManager.ts    (Web Audio API synthesizer)
│       └── components/
│           ├── MainMenu.tsx
│           ├── GameScreen.tsx
│           ├── GameHUD.tsx
│           ├── GameOver.tsx
│           └── HighScores.tsx
```

## Running the Game

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Scope

**Included**: Single-player, 3 maps, 3 difficulties, high scores, sound, pan/zoom, minimap  
**Excluded**: Multiplayer, online hosting, user accounts, mobile/touch support, achievements, map editor, tile animations
