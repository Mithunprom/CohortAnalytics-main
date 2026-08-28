/**
 * Daily contract engine — one shared objective per calendar day.
 * Seeded from the local date key so every player on the same day gets the
 * same contract (and, with the seeded cave, the same map to run it on).
 * No purchases, no randomised rewards: the reward is fixed and known up front.
 */

import { dateKey, pickIndex } from './dates.js'

export const CONTRACT_XP = 30
export const CONTRACT_EXPLORE_XP = 10

/**
 * How repeated samples of a metric fold together across a day.
 * `sum` totals every run, `best` keeps the single best run.
 */
export const METRIC_AGG = {
  ores: 'sum',
  crystals: 'sum',
  stars: 'sum',
  revealed: 'sum',
  depth: 'best',
  runCrystals: 'best',
  runOres: 'best',
  combo: 'best',
  neonScore: 'best',
  delveScore: 'best'
}

export const CONTRACTS = [
  {
    id: 'ore-run',
    title: 'Ore Run',
    blurb: 'Mine 3 glow-ore anywhere in the Rift.',
    metric: 'ores',
    goal: 3,
    unit: 'ore',
    game: 'riftDelve'
  },
  {
    id: 'deep-cut',
    title: 'Deep Cut',
    blurb: 'Reach depth 10 before you extract.',
    metric: 'depth',
    goal: 10,
    unit: 'depth',
    game: 'riftDelve'
  },
  {
    id: 'clean-extract',
    title: 'Clean Extract',
    blurb: 'Extract from one run holding 2 crystals.',
    metric: 'runCrystals',
    goal: 2,
    unit: 'crystal',
    game: 'riftDelve'
  },
  {
    id: 'chain-reaction',
    title: 'Chain Reaction',
    blurb: 'Hold a 6x mining combo in a single run.',
    metric: 'combo',
    goal: 6,
    unit: 'combo',
    game: 'riftDelve'
  },
  {
    id: 'big-haul',
    title: 'Big Haul',
    blurb: 'Cash out a Rift Delve run worth 220.',
    metric: 'delveScore',
    goal: 220,
    unit: 'score',
    game: 'riftDelve'
  },
  {
    id: 'star-sweep',
    title: 'Star Sweep',
    blurb: 'Catch 20 lanterns in Star Catch.',
    metric: 'stars',
    goal: 20,
    unit: 'star',
    game: 'starCatch'
  },
  {
    id: 'neon-eighty',
    title: 'Neon Eighty',
    blurb: 'Score 80 in a single Neon Rush.',
    metric: 'neonScore',
    goal: 80,
    unit: 'score',
    game: 'neonRush'
  }
]

/** The contract for a given local date key. Stable for that whole day. */
export function todaysContract(key = dateKey()) {
  const date = typeof key === 'string' && key ? key : dateKey()
  const contract = CONTRACTS[pickIndex(`contract:${date}`, CONTRACTS.length)]
  return { ...contract, date, xp: CONTRACT_XP, exploreXp: CONTRACT_EXPLORE_XP }
}

export function contractById(id) {
  return CONTRACTS.find((c) => c.id === id) || null
}

function finite(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/** Fold one run's metrics into the day's running totals. */
export function mergeMetrics(counts = {}, sample = {}) {
  const next = { ...(counts || {}) }
  for (const [metric, raw] of Object.entries(sample || {})) {
    const value = finite(raw)
    if (!value) continue
    if (METRIC_AGG[metric] === 'sum') next[metric] = finite(next[metric]) + value
    else next[metric] = Math.max(finite(next[metric]), value)
  }
  return next
}

/** Metrics readable from an arcade game id plus its final score. */
export function arcadeMetrics(gameId, score) {
  const value = finite(score)
  if (value <= 0) return {}
  if (gameId === 'starCatch') return { stars: value }
  if (gameId === 'neonRush') return { neonScore: value }
  if (gameId === 'riftDelve') return { delveScore: value }
  return {}
}

/** Metrics readable from a Rift Delve extraction payload. */
export function exploreMetrics(extra = {}) {
  const ores = finite(extra.ores)
  const crystals = finite(extra.crystals)
  return {
    ores,
    crystals,
    runOres: ores,
    runCrystals: crystals,
    depth: finite(extra.depth),
    revealed: finite(extra.revealed),
    combo: finite(extra.comboMax)
  }
}

export function runMetrics(gameId, score, extra = {}) {
  return mergeMetrics(arcadeMetrics(gameId, score), exploreMetrics(extra))
}

/**
 * Read a progress record against a contract.
 * Counts recorded on an earlier date are ignored so a new day starts clean
 * even before the player touches a game.
 */
export function contractProgress(progress = {}, contract = todaysContract()) {
  const c = contract && contract.metric ? contract : todaysContract()
  const record = progress || {}
  const current = !c.date || record.contractDate === c.date
  const counts = current ? record.contractCounts || {} : {}
  const goal = Math.max(1, finite(c.goal))
  const raw = Math.max(0, finite(counts[c.metric]))
  const claimed = current && !!record.contractDone
  return {
    id: c.id,
    date: c.date,
    title: c.title,
    blurb: c.blurb,
    metric: c.metric,
    unit: c.unit,
    game: c.game,
    goal,
    raw,
    value: Math.min(goal, Math.round(raw)),
    remaining: Math.max(0, goal - Math.round(raw)),
    pct: Math.min(100, Math.round((raw / goal) * 100)),
    xp: CONTRACT_XP,
    exploreXp: CONTRACT_EXPLORE_XP,
    done: raw >= goal || claimed,
    claimed
  }
}

export function contractComplete(progress = {}, contract = todaysContract()) {
  return contractProgress(progress, contract).done
}
