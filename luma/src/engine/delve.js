/** Original cave-delve sim — not a clone of any commercial sandbox. */

import { dateKey, hashString } from './dates.js'

export const TILE = {
  AIR: 0,
  SOIL: 1,
  STONE: 2,
  HARD: 3,
  ORE: 4,
  CRYSTAL: 5,
  BEDROCK: 6
}

export const TILE_HP = {
  [TILE.AIR]: 0,
  [TILE.SOIL]: 1,
  [TILE.STONE]: 2,
  [TILE.HARD]: 3,
  [TILE.ORE]: 2,
  [TILE.CRYSTAL]: 3,
  [TILE.BEDROCK]: 99
}

export const MAP_W = 40
export const MAP_H = 40
export const SPAWN = { x: 20, y: 20 }

export const DELVE_RANKS = [
  { id: 0, name: 'Scout', xp: 0, difficulty: 'Chill', minePower: 1, light: 4.2, rushSpeed: 1 },
  { id: 1, name: 'Runner', xp: 50, difficulty: 'Amped', minePower: 2, light: 5.1, rushSpeed: 1.25 },
  { id: 2, name: 'Delver', xp: 140, difficulty: 'Wild', minePower: 3, light: 6.2, rushSpeed: 1.5 },
  { id: 3, name: 'Mythic', xp: 320, difficulty: 'Insane', minePower: 4, light: 7.4, rushSpeed: 1.85 }
]

export function rankFromXp(xp) {
  let rank = DELVE_RANKS[0]
  for (const next of DELVE_RANKS) {
    if ((xp || 0) >= next.xp) rank = next
  }
  return rank
}

export function nextRank(xp) {
  const current = rankFromXp(xp)
  return DELVE_RANKS.find((r) => r.id === current.id + 1) || null
}

export function canMineTile(tile, minePower) {
  if (tile === TILE.AIR || tile === TILE.BEDROCK) return false
  if (tile === TILE.HARD || tile === TILE.CRYSTAL) return minePower >= 2
  return minePower >= 1
}

/**
 * Four original rift biomes. The seed picks one for the day, so the HUD can
 * name the place everyone is running and the palette shifts to match.
 */
export const BIOMES = [
  {
    id: 'ember-clay',
    name: 'Ember Clay',
    flavour: 'Warm packed clay. Soft digging, shallow veins.',
    accent: '#ff9a3d',
    palette: { air: '#170f10', soil: '#7a4326', stone: '#463441', hard: '#2a1f2c' }
  },
  {
    id: 'glowcap-hollow',
    name: 'Glowcap Hollow',
    flavour: 'Fungal light everywhere. Mites hate it here.',
    accent: '#8dff6a',
    palette: { air: '#101a12', soil: '#4f5c2c', stone: '#31463c', hard: '#1d2a26' }
  },
  {
    id: 'riftglass',
    name: 'Riftglass',
    flavour: 'Brittle glass shelves. Crystals sing when they break.',
    accent: '#63e7ff',
    palette: { air: '#0f1420', soil: '#3b5570', stone: '#2f3d5c', hard: '#1b2338' }
  },
  {
    id: 'void-veins',
    name: 'Void Veins',
    flavour: 'The dark pushes back. Deepest ore in the rift.',
    accent: '#c66bff',
    palette: { air: '#120c1c', soil: '#4a2f66', stone: '#33294b', hard: '#1d1730' }
  }
]

export function biomeFromSeed(seed = 1) {
  const n = Math.abs(Math.floor(Number(seed) || 0))
  return BIOMES[n % BIOMES.length]
}

/** Seed shared by everyone playing on the same local date. */
export function dailySeed(key = dateKey()) {
  const date = typeof key === 'string' && key ? key : dateKey()
  return hashString(`rift:${date}`)
}

export function dailyBiome(key = dateKey()) {
  return biomeFromSeed(dailySeed(key))
}

/** Mining chain: breaks inside the window keep the combo alive. */
export const COMBO_WINDOW = 1.2

export function comboStep(combo = 0, sinceLastBreak = Infinity, window = COMBO_WINDOW) {
  const gap = Number(sinceLastBreak)
  if (!Number.isFinite(gap) || gap > window) return 1
  return Math.max(1, Math.floor(combo)) + 1
}

/** Combos only start paying at 5, then scale so long chains feel worth it. */
export function comboBonus(combo = 0) {
  const n = Math.floor(Number(combo) || 0)
  if (n < 5) return 0
  return (n - 4) * 6
}

/** Neon Rush: a block sliding past a neighbouring lane is a near miss. */
export const NEAR_MISS_POINTS = 3

export function isNearMiss(playerLane, bitLane) {
  return Math.abs(Math.floor(playerLane) - Math.floor(bitLane)) === 1
}

export function nearMissBonus(count = 0) {
  return Math.max(0, Math.floor(Number(count) || 0)) * NEAR_MISS_POINTS
}

export function zoneDifficulty(depth) {
  if (depth < 6) return 'Chill'
  if (depth < 11) return 'Amped'
  if (depth < 16) return 'Wild'
  return 'Insane'
}

export function depthFrom(x, y) {
  return Math.max(Math.abs(x - SPAWN.x), Math.abs(y - SPAWN.y))
}

export function scoreRun({ revealed = 0, ores = 0, crystals = 0, depth = 0, hp = 3, comboMax = 0 }) {
  const survival = hp > 0 ? 15 : 0
  return revealed + ores * 12 + crystals * 20 + depth * 3 + survival + comboBonus(comboMax)
}

export function exploreXpFrom({ revealed = 0, ores = 0, crystals = 0, depth = 0 }) {
  return Math.max(1, Math.round(revealed * 0.35 + ores * 4 + crystals * 7 + depth * 0.8))
}

function mulberry(seed) {
  return function rand() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function generateCave(seed = 1) {
  const rand = mulberry(seed >>> 0 || 1)
  const biome = biomeFromSeed(seed)
  const soilBias = biome.id === 'ember-clay' ? 0.34 : biome.id === 'riftglass' ? 0.14 : 0.22
  const oreBias = biome.id === 'void-veins' ? 0.18 : 0.12
  const crystalBias = biome.id === 'riftglass' ? 0.13 : 0.08
  const tiles = new Array(MAP_W * MAP_H).fill(TILE.STONE)
  const at = (x, y) => y * MAP_W + x
  const inb = (x, y) => x > 0 && y > 0 && x < MAP_W - 1 && y < MAP_H - 1

  for (let i = 0; i < MAP_W * MAP_H; i++) {
    tiles[i] = rand() < soilBias ? TILE.SOIL : TILE.STONE
  }

  let x = SPAWN.x
  let y = SPAWN.y
  for (let step = 0; step < 900; step++) {
    tiles[at(x, y)] = TILE.AIR
    if (rand() < 0.35) tiles[at(Math.min(MAP_W - 2, x + 1), y)] = TILE.AIR
    if (rand() < 0.35) tiles[at(x, Math.min(MAP_H - 2, y + 1))] = TILE.AIR
    const dir = Math.floor(rand() * 4)
    if (dir === 0) x -= 1
    if (dir === 1) x += 1
    if (dir === 2) y -= 1
    if (dir === 3) y += 1
    x = Math.max(1, Math.min(MAP_W - 2, x))
    y = Math.max(1, Math.min(MAP_H - 2, y))
  }

  for (let gy = 1; gy < MAP_H - 1; gy++) {
    for (let gx = 1; gx < MAP_W - 1; gx++) {
      if (tiles[at(gx, gy)] !== TILE.AIR) continue
      const d = depthFrom(gx, gy)
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = gx + ox
        const ny = gy + oy
        if (!inb(nx, ny) || tiles[at(nx, ny)] === TILE.AIR) continue
        const roll = rand()
        if (d > 14 && roll < crystalBias) tiles[at(nx, ny)] = TILE.CRYSTAL
        else if (d > 7 && roll < oreBias) tiles[at(nx, ny)] = TILE.ORE
        else if (d > 10 && roll < 0.2) tiles[at(nx, ny)] = TILE.HARD
      }
    }
  }

  for (let i = 0; i < MAP_W; i++) {
    tiles[at(i, 0)] = TILE.BEDROCK
    tiles[at(i, MAP_H - 1)] = TILE.BEDROCK
    tiles[at(0, i)] = TILE.BEDROCK
    tiles[at(MAP_W - 1, i)] = TILE.BEDROCK
  }

  tiles[at(SPAWN.x, SPAWN.y)] = TILE.AIR
  tiles[at(SPAWN.x + 1, SPAWN.y)] = TILE.AIR
  tiles[at(SPAWN.x, SPAWN.y + 1)] = TILE.AIR

  const mites = []
  for (let i = 0; i < 10; i++) {
    const mx = 2 + Math.floor(rand() * (MAP_W - 4))
    const my = 2 + Math.floor(rand() * (MAP_H - 4))
    if (tiles[at(mx, my)] === TILE.AIR && depthFrom(mx, my) >= 8) {
      mites.push({ x: mx, y: my })
    }
  }

  return { tiles, mites, w: MAP_W, h: MAP_H, seed: seed >>> 0, biome }
}

/** Same map for everyone on the same local day. */
export function dailyCave(key = dateKey()) {
  return generateCave(dailySeed(key))
}

export function tileIndex(x, y, w = MAP_W) {
  return y * w + x
}
