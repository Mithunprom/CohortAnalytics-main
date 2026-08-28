import { rankFromXp } from './delve.js'
import { dateKey } from './dates.js'
import {
  CONTRACT_XP,
  CONTRACT_EXPLORE_XP,
  todaysContract,
  contractComplete,
  arcadeMetrics,
  exploreMetrics,
  mergeMetrics
} from './contracts.js'

export const STORAGE_KEY = 'luma.spark.v1'
export const PRODUCTS = {
  monthly: {
    id: 'luma_plus_monthly',
    label: 'Plus Monthly',
    price: 4.99,
    period: 'month',
    appleProductId: 'app.luma.spark.plus.monthly'
  },
  yearly: {
    id: 'luma_plus_yearly',
    label: 'Plus Yearly',
    price: 29.99,
    period: 'year',
    appleProductId: 'app.luma.spark.plus.yearly',
    savings: 'Save 50%'
  }
}

export const TRIAL_DAYS = 7
export const FREE_SPARKS_PER_DAY = 1
export const FREE_ARCADE_PLAYS = 2
export const FREE_REROLLS = 0
export const PLUS_REROLLS = 12
export const XP_PER_SPARK = 25
export const XP_PER_GAME = 10
export const STAGE_THRESHOLDS = [0, 80, 250, 600, 1200]
export const STAGE_NAMES = ['Ember', 'Spark', 'Flame', 'Aurora', 'Nova']

export const HABITATS = [
  { id: 'night', name: 'Night Sky', plus: false, sky: 'void' },
  { id: 'aurora', name: 'Aurora Veil', plus: true, sky: 'aurora' },
  { id: 'coral', name: 'Coral Tide', plus: true, sky: 'coral' },
  { id: 'cabin', name: 'Cabin Glow', plus: true, sky: 'cabin' }
]

export const SKINS = [
  { id: 'ember', name: 'Ember', plus: false },
  { id: 'mint', name: 'Mint Comet', plus: true },
  { id: 'orchid', name: 'Orchid', plus: true },
  { id: 'gold', name: 'Solar Gold', plus: true }
]

export const BADGES = [
  { id: 'first-light', name: 'First Light', test: (s) => s.totalSparks >= 1 },
  { id: 'week-glow', name: 'Week Glow', test: (s) => s.longestStreak >= 7 },
  { id: 'constellation-12', name: 'Twelve Stars', test: (s) => s.totalSparks >= 12 },
  { id: 'arcade-ace', name: 'Arcade Ace', test: (s) => Object.values(s.highScores || {}).some((n) => n >= 40) },
  { id: 'cave-scout', name: 'Cave Scout', test: (s) => (s.exploreXp || 0) >= 8 },
  { id: 'deep-cut', name: 'Deep Cut', test: (s) => (s.bestDepth || 0) >= 12 },
  { id: 'mythic-delver', name: 'Mythic Delver', test: (s) => rankFromXp(s.exploreXp || 0).id >= 3 },
  { id: 'kind-heart', name: 'Kind Heart', test: (s) => (s.categoryCounts?.kindness || 0) >= 5 },
  { id: 'wordsmith', name: 'Wordsmith', test: (s) => (s.categoryCounts?.create || 0) >= 5 },
  { id: 'contractor', name: 'Contractor', test: (s) => (s.contractXP || 0) >= CONTRACT_XP },
  { id: 'nova', name: 'Went Nova', test: (s) => stageFromXp(s.xp) >= 4 }
]

export function stageFromXp(xp) {
  let stage = 0
  for (let i = 0; i < STAGE_THRESHOLDS.length; i++) {
    if (xp >= STAGE_THRESHOLDS[i]) stage = i
  }
  return stage
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function defaultState() {
  return {
    profile: {
      name: '',
      intents: [],
      onboardingDone: false,
      createdAt: null
    },
    subscription: {
      plan: 'free',
      productId: null,
      trialEndsAt: null,
      expiresAt: null,
      startedAt: null
    },
    progress: {
      streak: 0,
      longestStreak: 0,
      lastSparkDate: null,
      totalSparks: 0,
      xp: 0,
      sparksToday: 0,
      lastActiveDate: null,
      rerollsToday: 0,
      lastRerollDate: null,
      arcadePlaysToday: 0,
      lastArcadeDate: null,
      streakShields: 0,
      constellation: {},
      badges: [],
      categoryCounts: {},
      highScores: { starCatch: 0, glowMemory: 0, wordSpark: 0, riftDelve: 0, neonRush: 0 },
      nest: { habitat: 'night', skin: 'ember' },
      moodToday: null,
      lastMoodDate: null,
      questOffset: 0,
      exploreXp: 0,
      bestDepth: 0,
      oresFound: 0,
      crystalsFound: 0,
      bestCombo: 0,
      contractDate: null,
      contractId: null,
      contractDone: false,
      contractXP: 0,
      contractCounts: {}
    }
  }
}

export function isPlusActive(subscription, now = new Date()) {
  if (!subscription || subscription.plan === 'free') return false
  if (subscription.expiresAt && new Date(subscription.expiresAt) < now) return false
  return true
}

export function dailyCounters(progress, today) {
  const sparksToday = progress.lastActiveDate === today ? progress.sparksToday : 0
  const rerollsToday = progress.lastRerollDate === today ? progress.rerollsToday : 0
  const arcadePlaysToday = progress.lastArcadeDate === today ? progress.arcadePlaysToday : 0
  return { sparksToday, rerollsToday, arcadePlaysToday }
}

export function sparkLimit(plus) {
  return plus ? Infinity : FREE_SPARKS_PER_DAY
}

export function rerollLimit(plus) {
  return plus ? PLUS_REROLLS : FREE_REROLLS
}

export function arcadeLimit(plus) {
  return plus ? Infinity : FREE_ARCADE_PLAYS
}

export function canCompleteSpark(state, today) {
  const plus = isPlusActive(state.subscription)
  const { sparksToday } = dailyCounters(state.progress, today)
  return sparksToday < sparkLimit(plus)
}

export function canReroll(state, today) {
  const plus = isPlusActive(state.subscription)
  const { rerollsToday } = dailyCounters(state.progress, today)
  return rerollsToday < rerollLimit(plus)
}

export function canPlayArcade(state, today) {
  const plus = isPlusActive(state.subscription)
  const { arcadePlaysToday } = dailyCounters(state.progress, today)
  return arcadePlaysToday < arcadeLimit(plus)
}

export function applySparkCompletion(state, { today, quest, answer, yesterdayFn }) {
  const isYday = yesterdayFn
  const next = clone(state)
  const { sparksToday } = dailyCounters(next.progress, today)
  next.progress.lastActiveDate = today
  next.progress.sparksToday = sparksToday + 1
  next.progress.totalSparks += 1
  next.progress.xp += XP_PER_SPARK

  if (next.progress.lastSparkDate === today) {
    // extra spark same day keeps streak
  } else if (!next.progress.lastSparkDate) {
    next.progress.streak = 1
  } else if (isYday(next.progress.lastSparkDate, today)) {
    next.progress.streak += 1
  } else if (next.progress.streakShields > 0) {
    next.progress.streakShields -= 1
    next.progress.streak += 1
  } else {
    next.progress.streak = 1
  }

  next.progress.lastSparkDate = today
  next.progress.longestStreak = Math.max(next.progress.longestStreak, next.progress.streak)
  next.progress.constellation[today] = {
    questId: quest.id,
    title: quest.title,
    category: quest.category,
    answer: answer || '',
    completedAt: new Date().toISOString()
  }
  const cat = quest.category || 'play'
  next.progress.categoryCounts[cat] = (next.progress.categoryCounts[cat] || 0) + 1
  next.progress.badges = unlockBadges(next.progress)
  if (next.progress.streak > 0 && next.progress.streak % 7 === 0 && isPlusActive(next.subscription)) {
    next.progress.streakShields += 1
  }
  return next
}

export function applyReroll(state, today) {
  const next = clone(state)
  const { rerollsToday } = dailyCounters(next.progress, today)
  next.progress.lastRerollDate = today
  next.progress.rerollsToday = rerollsToday + 1
  next.progress.questOffset = (next.progress.questOffset || 0) + 1
  return next
}

/**
 * Roll one run's metrics into today's contract and pay the bonus the first
 * time the goal is met. Mutates `progress` in place; callers already cloned.
 * Safe to call more than once per run — the bonus is gated on contractDone.
 */
export function trackContract(progress, today, sample) {
  const contract = todaysContract(today)
  if (progress.contractDate !== contract.date || progress.contractId !== contract.id) {
    progress.contractDate = contract.date
    progress.contractId = contract.id
    progress.contractDone = false
    progress.contractCounts = {}
  }
  progress.contractCounts = mergeMetrics(progress.contractCounts, sample)
  if (progress.contractDone || !contractComplete(progress, contract)) return false
  progress.contractDone = true
  progress.contractXP = (progress.contractXP || 0) + CONTRACT_XP
  progress.xp = (progress.xp || 0) + CONTRACT_XP
  progress.exploreXp = (progress.exploreXp || 0) + CONTRACT_EXPLORE_XP
  return true
}

export function applyArcadePlay(state, today, gameId, score) {
  const next = clone(state)
  const { arcadePlaysToday } = dailyCounters(next.progress, today)
  next.progress.lastArcadeDate = today
  next.progress.arcadePlaysToday = arcadePlaysToday + 1
  next.progress.xp += XP_PER_GAME
  if (typeof score === 'number') {
    const prev = next.progress.highScores[gameId] || 0
    next.progress.highScores[gameId] = Math.max(prev, score)
  }
  trackContract(next.progress, today, arcadeMetrics(gameId, score))
  next.progress.badges = unlockBadges(next.progress)
  return next
}

export function applyExplore(state, extra = {}, today = dateKey()) {
  const { exploreXp = 0, depth = 0, ores = 0, crystals = 0, comboMax = 0 } = extra
  const next = clone(state)
  next.progress.exploreXp = (next.progress.exploreXp || 0) + Math.max(0, exploreXp)
  next.progress.bestDepth = Math.max(next.progress.bestDepth || 0, depth || 0)
  next.progress.oresFound = (next.progress.oresFound || 0) + (ores || 0)
  next.progress.crystalsFound = (next.progress.crystalsFound || 0) + (crystals || 0)
  next.progress.bestCombo = Math.max(next.progress.bestCombo || 0, comboMax || 0)
  trackContract(next.progress, today, exploreMetrics(extra))
  next.progress.badges = unlockBadges(next.progress)
  return next
}

export function applySubscribe(state, productKey, now = new Date()) {
  const product = PRODUCTS[productKey]
  if (!product) throw new Error('Unknown product')
  const next = clone(state)
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)
  const expires = new Date(now)
  if (product.period === 'year') expires.setFullYear(expires.getFullYear() + 1)
  else expires.setMonth(expires.getMonth() + 1)
  next.subscription = {
    plan: productKey,
    productId: product.appleProductId,
    trialEndsAt: trialEnd.toISOString(),
    expiresAt: expires.toISOString(),
    startedAt: now.toISOString()
  }
  next.progress.streakShields += 1
  return next
}

export function applyRestore(state, snapshot) {
  const next = clone(state)
  next.subscription = { ...next.subscription, ...snapshot }
  return next
}

export function unlockBadges(progress) {
  const earned = new Set(progress.badges || [])
  for (const badge of BADGES) {
    if (badge.test(progress)) earned.add(badge.id)
  }
  return [...earned]
}

export function habitatAllowed(habitatId, plus) {
  const habitat = HABITATS.find((h) => h.id === habitatId)
  if (!habitat) return false
  return plus || !habitat.plus
}

export function skinAllowed(skinId, plus) {
  const skin = SKINS.find((s) => s.id === skinId)
  if (!skin) return false
  return plus || !skin.plus
}
