import { defaultState, applySparkCompletion, applyReroll, applyArcadePlay, applySubscribe, applyExplore, isPlusActive, canCompleteSpark, canPlayArcade, canReroll, stageFromXp, planFromProductId, PRODUCTS } from './rules.js'
import { isYesterday, dateKey, pickIndex, addDays } from './dates.js'
import { riddleCorrect, scrambleWord, todaysQuest } from './quests.js'
import { createStore } from './store.js'
import { STORAGE_KEY } from './rules.js'
import {
  rankFromXp,
  canMineTile,
  generateCave,
  dailyCave,
  dailySeed,
  dailyBiome,
  biomeFromSeed,
  comboStep,
  comboBonus,
  scoreRun,
  isNearMiss,
  nearMissBonus,
  NEAR_MISS_POINTS,
  BIOMES,
  COMBO_WINDOW,
  TILE,
  TILE_HP,
  tileIndex,
  MAP_W,
  MAP_H,
  SPAWN
} from './delve.js'
import {
  CONTRACTS,
  CONTRACT_XP,
  CONTRACT_EXPLORE_XP,
  todaysContract,
  contractProgress,
  contractComplete,
  arcadeMetrics,
  exploreMetrics,
  mergeMetrics
} from './contracts.js'
import { describe, expect, it, beforeEach } from 'vitest'
import { createApp, h } from 'vue'
import RiftDelve from '../components/games/RiftDelve.vue'
import NeonRush from '../components/games/NeonRush.vue'
import StarCatch from '../components/games/StarCatch.vue'

// jsdom ships no 2D canvas context; the games already no-op when it is missing.
HTMLCanvasElement.prototype.getContext = () => null

function mountGame(Comp, props = {}) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  let payload = null
  const app = createApp({ render: () => h(Comp, { ...props, onDone: (p) => { payload = p } }) })
  const vm = app.mount(host)
  return { app, game: vm.$.subTree.component.proxy, done: () => payload }
}

function stateWith(overrides = {}) {
  const s = defaultState()
  return {
    ...s,
    ...overrides,
    profile: { ...s.profile, ...(overrides.profile || {}) },
    subscription: { ...s.subscription, ...(overrides.subscription || {}) },
    progress: { ...s.progress, ...(overrides.progress || {}) }
  }
}

const quest = { id: 'q1', title: 'Six-word story', category: 'create' }

describe('dates', () => {
  it('formats local date keys without UTC drift', () => {
    expect(dateKey(new Date(2026, 7, 28))).toBe('2026-08-28')
  })

  it('detects consecutive days', () => {
    expect(isYesterday('2026-08-27', '2026-08-28')).toBe(true)
    expect(isYesterday('2026-08-26', '2026-08-28')).toBe(false)
  })

  it('picks a stable index', () => {
    expect(pickIndex('seed', 10)).toBe(pickIndex('seed', 10))
  })
})

describe('subscription and limits', () => {
  it('treats free users as not plus', () => {
    expect(isPlusActive(defaultState().subscription)).toBe(false)
  })

  it('treats an unexpired plus plan as active', () => {
    const sub = applySubscribe(defaultState(), 'yearly').subscription
    expect(isPlusActive(sub)).toBe(true)
  })

  it('lets a free user complete one spark per day', () => {
    const s = defaultState()
    expect(canCompleteSpark(s, '2026-08-28')).toBe(true)
    const next = applySparkCompletion(s, { today: '2026-08-28', quest, answer: 'hi', yesterdayFn: isYesterday })
    expect(canCompleteSpark(next, '2026-08-28')).toBe(false)
    expect(canCompleteSpark(next, '2026-08-29')).toBe(true)
  })

  it('lets plus users complete extra sparks', () => {
    let s = applySubscribe(defaultState(), 'monthly')
    s = applySparkCompletion(s, { today: '2026-08-28', quest, answer: 'a', yesterdayFn: isYesterday })
    expect(canCompleteSpark(s, '2026-08-28')).toBe(true)
  })

  it('blocks free rerolls and allows plus rerolls', () => {
    const free = defaultState()
    expect(canReroll(free, '2026-08-28')).toBe(false)
    const plus = applySubscribe(free, 'yearly')
    expect(canReroll(plus, '2026-08-28')).toBe(true)
    const rolled = applyReroll(plus, '2026-08-28')
    expect(rolled.progress.questOffset).toBe(1)
  })

  it('maps Apple product ids onto Plus plans', () => {
    expect(planFromProductId(PRODUCTS.monthly.appleProductId)).toBe('monthly')
    expect(planFromProductId(PRODUCTS.yearly.appleProductId)).toBe('yearly')
    expect(planFromProductId('unknown')).toBe(null)
  })

  it('does not stack streak shields when Plus is already active', () => {
    const first = applySubscribe(defaultState(), 'monthly')
    expect(first.progress.streakShields).toBe(1)
    const second = applySubscribe(first, 'yearly')
    expect(second.progress.streakShields).toBe(1)
    expect(second.subscription.plan).toBe('yearly')
  })

  it('caps free arcade energy at two plays', () => {
    let s = defaultState()
    expect(canPlayArcade(s, '2026-08-28')).toBe(true)
    s = applyArcadePlay(s, '2026-08-28', 'starCatch', 12)
    s = applyArcadePlay(s, '2026-08-28', 'starCatch', 20)
    expect(s.progress.highScores.starCatch).toBe(20)
    expect(canPlayArcade(s, '2026-08-28')).toBe(false)
  })
})

describe('streaks and stages', () => {
  it('starts a streak on the first spark', () => {
    const next = applySparkCompletion(defaultState(), { today: '2026-08-28', quest, answer: 'x', yesterdayFn: isYesterday })
    expect(next.progress.streak).toBe(1)
    expect(next.progress.badges).toContain('first-light')
  })

  it('increments streak across consecutive days', () => {
    let s = applySparkCompletion(defaultState(), { today: '2026-08-27', quest, answer: 'x', yesterdayFn: isYesterday })
    s = applySparkCompletion(s, { today: '2026-08-28', quest, answer: 'y', yesterdayFn: isYesterday })
    expect(s.progress.streak).toBe(2)
  })

  it('resets a streak after a missed day without a shield', () => {
    let s = applySparkCompletion(defaultState(), { today: '2026-08-20', quest, answer: 'x', yesterdayFn: isYesterday })
    s = applySparkCompletion(s, { today: '2026-08-28', quest, answer: 'y', yesterdayFn: isYesterday })
    expect(s.progress.streak).toBe(1)
  })

  it('spends a streak shield instead of resetting', () => {
    let s = stateWith({ progress: { ...defaultState().progress, lastSparkDate: '2026-08-20', streak: 5, streakShields: 1 } })
    s = applySparkCompletion(s, { today: '2026-08-28', quest, answer: 'y', yesterdayFn: isYesterday })
    expect(s.progress.streak).toBe(6)
    expect(s.progress.streakShields).toBe(0)
  })

  it('maps xp to companion stages', () => {
    expect(stageFromXp(0)).toBe(0)
    expect(stageFromXp(80)).toBe(1)
    expect(stageFromXp(1200)).toBe(4)
  })
})

describe('quests', () => {
  it('returns a stable daily quest', () => {
    expect(todaysQuest('2026-08-28', 0).id).toBe(todaysQuest('2026-08-28', 0).id)
    expect(todaysQuest('2026-08-28', 1).id).not.toBe(todaysQuest('2026-08-28', 0).id)
  })

  it('accepts riddle answers case-insensitively', () => {
    expect(riddleCorrect({ answer: 'firefly' }, ' Firefly! ')).toBe(true)
    expect(riddleCorrect({ answer: 'firefly' }, 'moth')).toBe(false)
  })

  it('scrambles words without leaving them unchanged', () => {
    const word = 'ember'
    const scrambled = scrambleWord(word, '2026-08-28')
    expect(scrambled).not.toBe(word)
    expect([...scrambled].sort().join('')).toBe([...word].sort().join(''))
  })
})

describe('store snapshot after mutations', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps quest and plus flags after onboarding and a spark', () => {
    const store = createStore()
    store.completeOnboarding({ name: 'Mithun', intents: ['create'] })
    let view = store.get()
    expect(view.profile.onboardingDone).toBe(true)
    expect(view.quest).toBeTruthy()
    expect(view.quest.category).toBeTruthy()
    expect(view.plus).toBe(false)
    expect(view.gated).toBeTruthy()

    const result = store.completeSpark('A tiny spell for a shorter meeting today')
    expect(result.ok).toBe(true)
    view = store.get()
    expect(view.progress.streak).toBe(1)
    expect(view.quest.title).toBeTruthy()
    expect(view.plus).toBe(false)
    expect(view.gated.spark).toBe(true)
  })

  it('marks plus active immediately after subscribe', () => {
    const store = createStore()
    store.subscribePlan('yearly')
    const view = store.get()
    expect(view.plus).toBe(true)
    expect(view.subscription.plan).toBe('yearly')
    expect(localStorage.getItem(STORAGE_KEY)).toBeTruthy()
  })

  it('demo purchasePlan writes a local Plus receipt', async () => {
    const store = createStore()
    const result = await store.purchasePlan('monthly')
    expect(result.ok).toBe(true)
    expect(result.mode).toBe('demo')
    expect(store.get().plus).toBe(true)
    expect(store.get().subscription.source).toBe('demo')
    const restored = await store.restorePurchases()
    expect(restored.ok).toBe(true)
  })
})

describe('rift delve ranks', () => {
  it('starts as Scout and ranks up from explore xp', () => {
    expect(rankFromXp(0).name).toBe('Scout')
    expect(rankFromXp(50).name).toBe('Runner')
    expect(rankFromXp(140).difficulty).toBe('Wild')
    expect(rankFromXp(320).name).toBe('Mythic')
  })

  it('lets scouts mine ore but not crystal', () => {
    expect(canMineTile(TILE.ORE, 1)).toBe(true)
    expect(canMineTile(TILE.CRYSTAL, 1)).toBe(false)
    expect(canMineTile(TILE.CRYSTAL, 2)).toBe(true)
    expect(canMineTile(TILE.BEDROCK, 4)).toBe(false)
  })

  it('awards explore xp and depth from a run', () => {
    // A Star Catch day, so no explore metric can trip the contract bonus here.
    const next = applyExplore(defaultState(), { exploreXp: 60, depth: 14, ores: 3, crystals: 1 }, dateForContract('star-sweep'))
    expect(next.progress.exploreXp).toBe(60)
    expect(next.progress.bestDepth).toBe(14)
    expect(next.progress.badges).toContain('cave-scout')
    expect(next.progress.badges).toContain('deep-cut')
  })

  it('builds a cave with a spawn air pocket', () => {
    const cave = generateCave(42)
    expect(cave.tiles.length).toBe(MAP_W * MAP_H)
    expect(cave.tiles[SPAWN.y * MAP_W + SPAWN.x]).toBe(TILE.AIR)
  })
})

describe('daily cave and biomes', () => {
  it('gives everyone the same map on the same date', () => {
    expect(dailySeed('2026-08-28')).toBe(dailySeed('2026-08-28'))
    const a = dailyCave('2026-08-28')
    const b = dailyCave('2026-08-28')
    expect(a.tiles).toEqual(b.tiles)
    expect(a.mites).toEqual(b.mites)
  })

  it('rolls a different map on a different date', () => {
    const a = dailyCave('2026-08-28')
    const b = dailyCave('2026-08-29')
    expect(a.tiles).not.toEqual(b.tiles)
  })

  it('names a biome from the seed', () => {
    const biome = dailyBiome('2026-08-28')
    expect(BIOMES.map((b) => b.name)).toContain(biome.name)
    expect(biomeFromSeed(7).id).toBe(biomeFromSeed(7).id)
    expect(BIOMES.map((b) => b.name)).toEqual(['Ember Clay', 'Glowcap Hollow', 'Riftglass', 'Void Veins'])
  })

  it('hands the cave its own biome so the palette matches', () => {
    const cave = dailyCave('2026-08-28')
    expect(cave.biome.id).toBe(dailyBiome('2026-08-28').id)
  })
})

describe('mining combos', () => {
  it('grows a combo while breaks land inside the window', () => {
    expect(comboStep(0, Infinity)).toBe(1)
    expect(comboStep(1, 0.4)).toBe(2)
    expect(comboStep(2, COMBO_WINDOW - 0.01)).toBe(3)
  })

  it('resets a combo when the chain goes cold', () => {
    expect(comboStep(9, COMBO_WINDOW + 0.01)).toBe(1)
  })

  it('only pays out from five links up', () => {
    expect(comboBonus(0)).toBe(0)
    expect(comboBonus(4)).toBe(0)
    expect(comboBonus(5)).toBe(6)
    expect(comboBonus(8)).toBe(24)
  })

  it('folds the combo bonus into the run score', () => {
    const base = { revealed: 10, ores: 1, crystals: 0, depth: 4, hp: 3 }
    expect(scoreRun({ ...base, comboMax: 7 }) - scoreRun({ ...base, comboMax: 0 })).toBe(comboBonus(7))
  })
})

describe('neon rush near misses', () => {
  it('counts a block sliding past an adjacent lane', () => {
    expect(isNearMiss(1, 0)).toBe(true)
    expect(isNearMiss(1, 2)).toBe(true)
    expect(isNearMiss(1, 1)).toBe(false)
    expect(isNearMiss(0, 2)).toBe(false)
  })

  it('scores near misses linearly', () => {
    expect(nearMissBonus(0)).toBe(0)
    expect(nearMissBonus(4)).toBe(nearMissBonus(1) * 4)
  })
})

function dateForContract(id) {
  const start = new Date(2026, 0, 1)
  for (let i = 0; i < 400; i++) {
    const key = dateKey(addDays(start, i))
    if (todaysContract(key).id === id) return key
  }
  throw new Error(`no date seeds contract ${id}`)
}

describe('daily contracts', () => {
  it('returns the same contract for the same date', () => {
    const a = todaysContract('2026-08-28')
    const b = todaysContract('2026-08-28')
    expect(a.id).toBe(b.id)
    expect(a.goal).toBe(b.goal)
    expect(a.date).toBe('2026-08-28')
  })

  it('stamps the contract with the date it was seeded from', () => {
    expect(todaysContract('2026-08-29').date).toBe('2026-08-29')
  })

  it('rotates across the catalog over a month', () => {
    const ids = new Set()
    for (let i = 0; i < 31; i++) ids.add(todaysContract(dateKey(addDays(new Date(2026, 7, 1), i))).id)
    expect(ids.size).toBeGreaterThan(1)
    for (const id of ids) expect(CONTRACTS.map((c) => c.id)).toContain(id)
  })

  it('reports zero progress for an untouched day', () => {
    const view = contractProgress(defaultState().progress, todaysContract('2026-08-28'))
    expect(view.value).toBe(0)
    expect(view.pct).toBe(0)
    expect(view.done).toBe(false)
  })

  it('ignores counts recorded on an earlier date', () => {
    const contract = todaysContract('2026-08-28')
    const stale = { contractDate: '2026-08-27', contractDone: true, contractCounts: { [contract.metric]: contract.goal } }
    expect(contractComplete(stale, contract)).toBe(false)
    expect(contractProgress(stale, contract).value).toBe(0)
  })

  it('reads progress recorded today', () => {
    const contract = todaysContract('2026-08-28')
    const progress = { contractDate: '2026-08-28', contractCounts: { [contract.metric]: contract.goal } }
    expect(contractComplete(progress, contract)).toBe(true)
    expect(contractProgress(progress, contract).pct).toBe(100)
  })

  it('sums count metrics and keeps the best single-run metrics', () => {
    let counts = mergeMetrics({}, { ores: 2, depth: 9 })
    counts = mergeMetrics(counts, { ores: 2, depth: 4 })
    expect(counts.ores).toBe(4)
    expect(counts.depth).toBe(9)
  })

  it('maps game payloads onto contract metrics', () => {
    expect(arcadeMetrics('starCatch', 21).stars).toBe(21)
    expect(arcadeMetrics('neonRush', 80).neonScore).toBe(80)
    expect(arcadeMetrics('glowMemory', 80)).toEqual({})
    expect(exploreMetrics({ ores: 3, crystals: 2, depth: 11, comboMax: 6 })).toMatchObject({
      ores: 3,
      runCrystals: 2,
      depth: 11,
      combo: 6
    })
  })
})

describe('contract completion bonus', () => {
  it('pays the bonus once when an explore contract is met', () => {
    const today = dateForContract('ore-run')
    const contract = todaysContract(today)
    let s = applyExplore(defaultState(), { exploreXp: 5, ores: contract.goal }, today)
    expect(s.progress.contractId).toBe('ore-run')
    expect(s.progress.contractDone).toBe(true)
    expect(s.progress.contractXP).toBe(CONTRACT_XP)
    expect(s.progress.xp).toBe(CONTRACT_XP)
    expect(s.progress.exploreXp).toBe(5 + CONTRACT_EXPLORE_XP)

    s = applyExplore(s, { exploreXp: 5, ores: contract.goal }, today)
    expect(s.progress.contractXP).toBe(CONTRACT_XP)
    expect(s.progress.xp).toBe(CONTRACT_XP)
    expect(s.progress.exploreXp).toBe(5 + CONTRACT_EXPLORE_XP + 5)
  })

  it('does not pay until the goal is actually met', () => {
    const today = dateForContract('ore-run')
    const s = applyExplore(defaultState(), { exploreXp: 2, ores: 1 }, today)
    expect(s.progress.contractDone).toBe(false)
    expect(s.progress.xp).toBe(0)
    expect(contractProgress(s.progress, todaysContract(today)).value).toBe(1)
  })

  it('accumulates across runs on the same day', () => {
    const today = dateForContract('ore-run')
    let s = applyExplore(defaultState(), { ores: 1 }, today)
    s = applyExplore(s, { ores: 1 }, today)
    expect(s.progress.contractDone).toBe(false)
    s = applyExplore(s, { ores: 1 }, today)
    expect(s.progress.contractDone).toBe(true)
  })

  it('pays a score contract from an arcade play', () => {
    const today = dateForContract('neon-eighty')
    const s = applyArcadePlay(defaultState(), today, 'neonRush', 90)
    expect(s.progress.contractDone).toBe(true)
    expect(s.progress.contractXP).toBe(CONTRACT_XP)
    expect(s.progress.badges).toContain('contractor')
  })

  it('pays a combo contract from a delve payload', () => {
    const today = dateForContract('chain-reaction')
    const goal = todaysContract(today).goal
    const s = applyExplore(defaultState(), { exploreXp: 4, comboMax: goal }, today)
    expect(s.progress.contractDone).toBe(true)
    expect(s.progress.bestCombo).toBe(goal)
  })

  it('starts a fresh contract when the date rolls over', () => {
    const first = dateForContract('ore-run')
    let s = applyExplore(defaultState(), { ores: 9 }, first)
    expect(s.progress.contractDone).toBe(true)
    const later = dateKey(addDays(new Date(`${first}T12:00:00`), 1))
    s = applyExplore(s, { ores: 1 }, later)
    expect(s.progress.contractDate).toBe(later)
    expect(s.progress.contractDone).toBe(contractComplete(s.progress, todaysContract(later)))
    expect(s.progress.contractCounts.ores).toBeLessThanOrEqual(1)
  })
})

describe('store exposes the daily contract', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('publishes dailyContract and contractDone on the snapshot', () => {
    const store = createStore()
    const view = store.get()
    expect(view.dailyContract).toBeTruthy()
    expect(view.dailyContract.date).toBe(view.today)
    expect(view.dailyContract.title).toBeTruthy()
    expect(view.dailyContract.goal).toBeGreaterThan(0)
    expect(view.dailyContract.value).toBe(0)
    expect(view.contractDone).toBe(false)
    expect(view.dailyBiome.name).toBeTruthy()
  })

  it('flips contractDone after a qualifying run', () => {
    const store = createStore()
    const contract = store.get().dailyContract
    const extra = { exploreXp: 6, ...(exploreMetricsFor(contract)) }
    const result = store.playArcade(contract.game, contract.goal, extra)
    expect(result.ok).toBe(true)
    const view = store.get()
    expect(view.contractDone).toBe(true)
    expect(view.dailyContract.done).toBe(true)
    expect(view.progress.contractXP).toBe(CONTRACT_XP)
  })
})

describe('rift delve run', () => {
  it('mounts a daily cave, mines ore with juice, and extracts a payload', () => {
    const m = mountGame(RiftDelve, { exploreXp: 400 })
    const delve = m.game
    expect(delve.biome.name).toBeTruthy()
    expect(delve.revealedCount).toBeGreaterThan(0)

    // Plant ore where the player is already looking, then dig it out.
    const target = delve.facing()
    const i = tileIndex(target.x, target.y)
    delve.cave.tiles[i] = TILE.ORE
    delve.hpMap[i] = TILE_HP[TILE.ORE]
    delve.mining = true
    for (let n = 0; n < 6; n++) {
      delve.mineTick = 1
      delve.tryMine(0.2)
    }
    expect(delve.ores).toBe(1)
    expect(delve.combo).toBeGreaterThanOrEqual(1)
    expect(delve.particles.length).toBeGreaterThan(0)
    expect(delve.texts.some((t) => t.text === '+ore')).toBe(true)

    delve.hurt()
    expect(delve.hp).toBe(2)
    expect(delve.combo).toBe(0)

    delve.end()
    const payload = m.done()
    expect(payload.ores).toBe(1)
    expect(payload.comboMax).toBeGreaterThanOrEqual(1)
    for (const key of ['score', 'exploreXp', 'depth', 'crystals']) {
      expect(typeof payload[key]).toBe('number')
    }
    m.app.unmount()
  })

  it('steers and digs from a canvas drag', () => {
    const m = mountGame(RiftDelve, { exploreXp: 0 })
    const delve = m.game
    delve.onPointer({ type: 'pointerdown', pointerId: 1, clientX: 100, clientY: 100 })
    expect(delve.stick.active).toBe(true)
    expect(delve.mining).toBe(true)
    delve.onPointer({ type: 'pointermove', pointerId: 1, clientX: 200, clientY: 100 })
    expect(delve.keys.x).toBeGreaterThan(0)
    expect(delve.face).toEqual({ x: 1, y: 0 })
    delve.endPointer({ pointerId: 1 })
    expect(delve.stick.active).toBe(false)
    expect(delve.keys.x).toBe(0)
    expect(delve.mining).toBe(false)
    m.app.unmount()
  })
})

describe('neon rush run', () => {
  it('pays a combo shard, a graze, and flashes before reporting a crash', () => {
    const m = mountGame(NeonRush, { exploreXp: 0 })
    const rush = m.game
    // jsdom reports a zero-height stage, so the component falls back to 280.
    const inBand = 280 - 60

    rush.bits = [{ id: 1, lane: rush.lane, y: inBand, kind: 'shard', grazed: false }]
    rush.step()
    expect(rush.score).toBeGreaterThanOrEqual(8)
    expect(rush.combo).toBe(1)
    expect(rush.trail.length).toBe(1)

    const before = rush.score
    rush.bits = [{ id: 2, lane: rush.lane + 1, y: inBand, kind: 'block', grazed: false }]
    rush.step()
    expect(rush.score).toBe(before + NEAR_MISS_POINTS)
    expect(rush.nearMisses).toBe(1)

    rush.bits = [{ id: 3, lane: rush.lane, y: inBand, kind: 'block', grazed: false }]
    rush.step()
    expect(rush.flash).toBe(true)
    expect(rush.ended).toBe(true)
    expect(m.done()).toBe(null)
    m.app.unmount()
  })
})

describe('star catch run', () => {
  it('keeps one point per star so the star contract stays honest', () => {
    const m = mountGame(StarCatch, { exploreXp: 0 })
    const sc = m.game
    sc.stars = [{ id: 1, x: 10, y: 10 }, { id: 2, x: 20, y: 20 }]
    sc.catchStar(1)
    sc.catchStar(2)
    expect(sc.score).toBe(2)
    expect(sc.streak).toBe(2)
    expect(sc.pops.length).toBe(2)
    m.app.unmount()
  })
})

/** Build a delve payload that satisfies whichever contract today rolled. */
function exploreMetricsFor(contract) {
  if (contract.metric === 'ores') return { ores: contract.goal }
  if (contract.metric === 'crystals' || contract.metric === 'runCrystals') return { crystals: contract.goal }
  if (contract.metric === 'depth') return { depth: contract.goal }
  if (contract.metric === 'combo') return { comboMax: contract.goal }
  return { depth: 1 }
}
