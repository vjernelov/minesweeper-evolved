export type MapName = 'hormuz' | 'oresund' | 'gulfOfMexico';

export interface MapInfo {
  name: MapName;
  label: string;
  description: string;
}

export const MAP_LIST: MapInfo[] = [
  { name: 'hormuz', label: 'Strait of Hormuz', description: 'Narrow passage between Iran and Oman' },
  { name: 'oresund', label: 'Öresund', description: 'The strait between Denmark and Sweden' },
  { name: 'gulfOfMexico', label: 'Gulf of Mexico', description: 'Vast waters bordered by the Americas' },
];

// Maps are 64x64 grids. true = land, false = sea.
// These are generated procedurally to loosely resemble the real geography.

function createEmptyMap(): boolean[][] {
  return Array.from({ length: 64 }, () => Array(64).fill(false));
}

function fillRect(map: boolean[][], x: number, y: number, w: number, h: number) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const my = y + dy;
      const mx = x + dx;
      if (my >= 0 && my < 64 && mx >= 0 && mx < 64) {
        map[my][mx] = true;
      }
    }
  }
}

function fillEllipse(map: boolean[][], cx: number, cy: number, rx: number, ry: number) {
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        map[y][x] = true;
      }
    }
  }
}

function addNoise(map: boolean[][], seed: number) {
  // Simple pseudo-random noise to make coastlines less geometric
  let s = seed;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const r = (s >> 16) / 32768;
      // Only modify cells near coastline (adjacent to both land and sea)
      let hasLandNeighbor = false;
      let hasSeaNeighbor = false;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny >= 0 && ny < 64 && nx >= 0 && nx < 64) {
            if (map[ny][nx]) hasLandNeighbor = true;
            else hasSeaNeighbor = true;
          }
        }
      }
      if (hasLandNeighbor && hasSeaNeighbor) {
        if (map[y][x] && r < 0.3) map[y][x] = false;
        else if (!map[y][x] && r < 0.2) map[y][x] = true;
      }
    }
  }
}

function createHormuzMap(): boolean[][] {
  const map = createEmptyMap();
  // Iran (top/north) - large landmass at the top
  fillRect(map, 0, 0, 64, 20);
  // Oman/UAE (bottom/south) - landmass at bottom-right
  fillRect(map, 30, 44, 34, 20);
  // Small island bits
  fillRect(map, 20, 48, 8, 16);
  // The strait is the water gap between y=20 and y=44
  // Add some peninsulas to narrow the strait
  fillEllipse(map, 40, 22, 8, 5);
  fillEllipse(map, 25, 42, 6, 4);
  addNoise(map, 42);
  return map;
}

function createOresundMap(): boolean[][] {
  const map = createEmptyMap();
  // Denmark (left side) - thin strip
  fillRect(map, 0, 0, 12, 64);
  // Sweden (right side) - thin strip
  fillRect(map, 52, 0, 12, 64);
  // Peninsulas to create the narrow Copenhagen-Malmö crossing
  fillRect(map, 12, 0, 5, 16);
  fillRect(map, 12, 48, 5, 16);
  fillRect(map, 47, 0, 5, 20);
  fillRect(map, 47, 44, 5, 20);
  // The Öresund is the wide water channel in the middle
  addNoise(map, 73);
  return map;
}

function createGulfOfMexicoMap(): boolean[][] {
  const map = createEmptyMap();
  // USA (top - from Texas to Florida)
  fillRect(map, 0, 0, 64, 16);
  // Florida peninsula (top-right going down)
  fillRect(map, 50, 16, 14, 20);
  fillEllipse(map, 54, 36, 6, 4);
  // Mexico (left side going down)
  fillRect(map, 0, 0, 16, 50);
  // Yucatan peninsula (bottom-left bump)
  fillRect(map, 16, 44, 14, 20);
  fillEllipse(map, 24, 44, 8, 6);
  // Cuba (island in bottom-right)
  fillEllipse(map, 48, 50, 12, 3);
  // The Gulf is the open water in the center
  addNoise(map, 107);
  return map;
}

const mapCache: Partial<Record<MapName, boolean[][]>> = {};

export function getMapData(name: MapName): boolean[][] {
  if (!mapCache[name]) {
    switch (name) {
      case 'hormuz': mapCache[name] = createHormuzMap(); break;
      case 'oresund': mapCache[name] = createOresundMap(); break;
      case 'gulfOfMexico': mapCache[name] = createGulfOfMexicoMap(); break;
    }
  }
  return mapCache[name]!;
}
