/**
 * MapAnimations.ts
 * Manages thematic animated characters and creatures on each map.
 *
 * Öresund:   Danish and Swedish Vikings yelling across the strait
 * Hormuz:    Persians and Arabs yelling at each other, camels wandering
 * Gulf:      Cowboys on the US coastline
 */

import type { Camera } from './CanvasRenderer';
import { MapName } from '../maps';

const TILE = 32;
const T = (n: number) => n * TILE;
const ENTITY_SIZE = TILE * 5; // 160 px — 5×5 tiles

// ---------------------------------------------------------------------------
// Image cache — images are loaded once and reused across frames
// ---------------------------------------------------------------------------
const imageCache: Map<string, HTMLImageElement> = new Map();

function loadImage(url: string): HTMLImageElement {
  if (!imageCache.has(url)) {
    const img = new Image();
    img.src = url;
    imageCache.set(url, img);
  }
  return imageCache.get(url)!;
}

const VIKING_IMG = '/viking.jpg';

interface Entity {
  emoji: string;
  image?: HTMLImageElement;  // optional sprite; used instead of emoji when loaded
  wx: number;       // world x in pixels (entity center) — fixed, no movement
  wy: number;       // world y in pixels (entity center) — fixed, no movement
  speeches: string[];
  speech: string;
  speechVisible: boolean;
  speechTimer: number;   // seconds remaining for current speech
  nextSpeech: number;    // seconds until next speech
}

let lastTs = 0;
let activeMap: MapName | null = null;
const entityPool: Partial<Record<MapName, Entity[]>> = {};

function mkEntity(
  emoji: string,
  wx: number, wy: number,
  speeches: string[],
  imageUrl?: string
): Entity {
  return {
    emoji, wx, wy,
    image: imageUrl ? loadImage(imageUrl) : undefined,
    speeches,
    speech: '',
    speechVisible: false,
    speechTimer: 0,
    nextSpeech: 1 + Math.random() * 7,
  };
}

// ---------------------------------------------------------------------------
// Öresund: Danish Vikings (west) and Swedish Vikings (east) yelling across
// ---------------------------------------------------------------------------
function createOresundEntities(): Entity[] {
  const dk = ['HEJSA!', 'SKÅL! 🍺', 'RØGET ÅL!', 'VIKINGERNE!', 'HOJ!', 'ÅH NEJ!'];
  const se = ['HALLÅ DÄR!', 'SKÅL! 🍺', 'JÄTTEBRA!', 'NEJ NEJ NEJ!', 'LAGOM!', 'AHH!'];
  return [
    // Danish Vikings — east edge of Denmark coastline
    mkEntity('🧔', T(8), T(26), dk, VIKING_IMG),
    mkEntity('🧔', T(8), T(34), dk, VIKING_IMG),
    mkEntity('🧔', T(8), T(40), dk, VIKING_IMG),
    // Swedish Vikings — west edge of Sweden coastline
    mkEntity('🧔', T(55), T(26), se, VIKING_IMG),
    mkEntity('🧔', T(55), T(34), se, VIKING_IMG),
    mkEntity('🧔', T(55), T(40), se, VIKING_IMG),
  ];
}

// ---------------------------------------------------------------------------
// Hormuz: Persians (Iran/top), Arabs (Oman/bottom), Camels wandering
// ---------------------------------------------------------------------------
function createHormuzEntities(): Entity[] {
  const persian = ['SALAAM!', 'MERSI!', 'DORUD!', 'BEFARMAID!', 'CHAI? ☕', 'BALE!'];
  const arab    = ['YALLAH!', 'HABIBI!', 'SHUKRAN!', 'INSHALLAH!', 'MARHABA!', 'KHALAS!'];
  const mute    = ['  ']; // camels don't speak
  return [
    // Persians on Iran coastline (south edge near the strait)
    mkEntity('🧔', T(20), T(14), persian),
    mkEntity('🧔', T(38), T(11), persian),
    // Arabs on Oman coastline (north edge near the strait)
    mkEntity('👳', T(42), T(47), arab),
    mkEntity('👳', T(52), T(50), arab),
    // Camels on Iranian coastline
    mkEntity('🐪', T(12), T(9),  mute),
    mkEntity('🐪', T(40), T(13), mute),
    // Camel on Oman coastline
    mkEntity('🐪', T(47), T(52), mute),
  ];
}

// ---------------------------------------------------------------------------
// Gulf of Mexico: Cowboys on the US coastline
// ---------------------------------------------------------------------------
function createGulfEntities(): Entity[] {
  const cowboy = ['YEEHAW!', 'HOWDY!', "Y'ALL!", 'GIT ALONG!', 'WOOOO! 🤠', 'PARDNER!'];
  return [
    mkEntity('🤠', T(12), T(8),  cowboy),
    mkEntity('🤠', T(28), T(6),  cowboy),
    mkEntity('🤠', T(42), T(9),  cowboy),
  ];
}

function getEntities(mapName: MapName): Entity[] {
  if (!entityPool[mapName]) {
    if      (mapName === 'oresund')     entityPool[mapName] = createOresundEntities();
    else if (mapName === 'hormuz')      entityPool[mapName] = createHormuzEntities();
    else                                entityPool[mapName] = createGulfEntities();
  }
  return entityPool[mapName]!;
}

// ---------------------------------------------------------------------------
// Drawing helpers
// ---------------------------------------------------------------------------
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  wx: number, wy: number,
  text: string
) {
  const fontSize = 10;
  ctx.font = `bold ${fontSize}px sans-serif`;
  const tw = ctx.measureText(text).width;
  const pad = 5;
  const bw = Math.max(tw + pad * 2, 32);
  const bh = fontSize + pad * 2;
  const tailH = 6;
  const bx = wx - bw / 2;
  const by = wy - ENTITY_SIZE / 2 - bh - tailH;

  ctx.save();

  // Bubble body
  drawRoundedRect(ctx, bx, by, bw, bh, 4);
  ctx.fillStyle = 'rgba(255, 252, 220, 0.95)';
  ctx.fill();
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Tail triangle (no top edge, blends with bubble bottom)
  ctx.beginPath();
  ctx.moveTo(wx - 4, by + bh);
  ctx.lineTo(wx,     by + bh + tailH);
  ctx.lineTo(wx + 4, by + bh);
  ctx.fillStyle = 'rgba(255, 252, 220, 0.95)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(wx - 4, by + bh);
  ctx.lineTo(wx,     by + bh + tailH);
  ctx.lineTo(wx + 4, by + bh);
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#222';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, wx, by + bh / 2);

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Public API — called every frame from inside CanvasRenderer's world-space
// transform (after scale/translate, before restore).
// ---------------------------------------------------------------------------
export function updateAndDrawAnimations(
  ctx: CanvasRenderingContext2D,
  camera: Camera,
  canvas: HTMLCanvasElement,
  mapName: MapName,
  timestamp: number
): void {
  // Reset delta when switching maps to avoid a large first-frame jump
  if (mapName !== activeMap) {
    lastTs = timestamp;
    activeMap = mapName;
  }

  const dt = Math.min((timestamp - lastTs) / 1000, 0.08);
  lastTs = timestamp;

  const entities = getEntities(mapName);

  // World-space visible bounds with margin for smooth pop-in
  const margin = 80;
  const vl = camera.x - margin;
  const vr = camera.x + canvas.width  / camera.zoom + margin;
  const vt = camera.y - margin;
  const vb = camera.y + canvas.height / camera.zoom + margin;

  for (const e of entities) {
    // ── Speech timer ────────────────────────────────────────────────────────
    const hasSpeech = e.speeches.some(s => s.trim().length > 1);
    e.nextSpeech -= dt;
    if (hasSpeech && e.nextSpeech <= 0 && !e.speechVisible) {
      e.speech = e.speeches[Math.floor(Math.random() * e.speeches.length)];
      e.speechVisible = true;
      e.speechTimer  = 3 + Math.random() * 2;
      e.nextSpeech   = 9 + Math.random() * 10;
    }
    if (e.speechVisible) {
      e.speechTimer -= dt;
      if (e.speechTimer <= 0) e.speechVisible = false;
    }

    // ── Draw (frustum cull) ─────────────────────────────────────────────────
    if (e.wx < vl || e.wx > vr || e.wy < vt || e.wy > vb) continue;

    const drawX = e.wx;
    const drawY = e.wy;

    // Speech bubble (drawn first so emoji appears on top)
    if (e.speechVisible && e.speech.trim().length > 0) {
      drawSpeechBubble(ctx, drawX, drawY, e.speech);
    }

    // Character — use sprite image if loaded, otherwise fall back to emoji
    ctx.save();
    ctx.translate(drawX, drawY);
    if (e.image && e.image.complete && e.image.naturalWidth > 0) {
      ctx.drawImage(e.image, -ENTITY_SIZE / 2, -ENTITY_SIZE / 2, ENTITY_SIZE, ENTITY_SIZE);
    } else {
      ctx.font = `${ENTITY_SIZE}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.emoji, 0, 0);
    }
    ctx.restore();
  }
}
