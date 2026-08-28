import { defaultState, applySparkCompletion, applyReroll, applyArcadePlay, applySubscribe, isPlusActive, canCompleteSpark, canPlayArcade, canReroll, stageFromXp } from './rules.js'
import { isYesterday, dateKey, pickIndex } from './dates.js'
import { riddleCorrect, scrambleWord, todaysQuest } from './quests.js'
import { describe, expect, it } from 'vitest'

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
