import { dateKey, isYesterday } from './dates.js'
import {
  STORAGE_KEY,
  defaultState,
  isPlusActive,
  canCompleteSpark,
  canReroll,
  canPlayArcade,
  applySparkCompletion,
  applyReroll,
  applyArcadePlay,
  applySubscribe,
  applyRestore,
  stageFromXp,
  STAGE_NAMES,
  dailyCounters,
  sparkLimit,
  rerollLimit,
  arcadeLimit,
  habitatAllowed,
  skinAllowed
} from './rules.js'
import { todaysQuest } from './quests.js'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

function save(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createStore() {
  let state = load()
  const listeners = new Set()

  function emit() {
    save(state)
    listeners.forEach((fn) => fn(state))
  }

  function snapshot() {
    const today = dateKey()
    const plus = isPlusActive(state.subscription)
    const counters = dailyCounters(state.progress, today)
    const quest = todaysQuest(today, state.progress.questOffset || 0, state.profile.intents)
    const stage = stageFromXp(state.progress.xp)
    return {
      ...state,
      today,
      plus,
      counters,
      quest,
      stage,
      stageName: STAGE_NAMES[stage],
      limits: {
        sparks: sparkLimit(plus),
        rerolls: rerollLimit(plus),
        arcade: arcadeLimit(plus)
      },
      gated: {
        spark: !canCompleteSpark(state, today),
        reroll: !canReroll(state, today),
        arcade: !canPlayArcade(state, today)
      }
    }
  }

  return {
    get: snapshot,
    subscribe(fn) {
      listeners.add(fn)
      fn(snapshot())
      return () => listeners.delete(fn)
    },
    reset() {
      state = defaultState()
      emit()
    },
    completeOnboarding({ name, intents }) {
      state = {
        ...state,
        profile: {
          name: name.trim(),
          intents,
          onboardingDone: true,
          createdAt: new Date().toISOString()
        }
      }
      emit()
    },
    setMood(mood) {
      const today = dateKey()
      state = {
        ...state,
        progress: { ...state.progress, moodToday: mood, lastMoodDate: today }
      }
      emit()
    },
    completeSpark(answer) {
      const today = dateKey()
      if (!canCompleteSpark(state, today)) {
        return { ok: false, reason: 'limit' }
      }
      const view = snapshot()
      state = applySparkCompletion(state, {
        today,
        quest: view.quest,
        answer,
        yesterdayFn: isYesterday
      })
      emit()
      return { ok: true }
    },
    reroll() {
      const today = dateKey()
      if (!canReroll(state, today)) return { ok: false, reason: 'limit' }
      state = applyReroll(state, today)
      emit()
      return { ok: true }
    },
    playArcade(gameId, score) {
      const today = dateKey()
      if (!canPlayArcade(state, today)) return { ok: false, reason: 'limit' }
      state = applyArcadePlay(state, today, gameId, score)
      emit()
      return { ok: true }
    },
    subscribePlan(productKey) {
      state = applySubscribe(state, productKey)
      emit()
    },
    restorePurchases() {
      try {
        const raw = localStorage.getItem(`${STORAGE_KEY}.receipt`)
        if (!raw) return { ok: false, reason: 'none' }
        state = applyRestore(state, JSON.parse(raw))
        emit()
        return { ok: true }
      } catch {
        return { ok: false, reason: 'none' }
      }
    },
    rememberReceipt() {
      localStorage.setItem(`${STORAGE_KEY}.receipt`, JSON.stringify(state.subscription))
    },
    setNest({ habitat, skin }) {
      const plus = isPlusActive(state.subscription)
      if (habitat && !habitatAllowed(habitat, plus)) return { ok: false, reason: 'plus' }
      if (skin && !skinAllowed(skin, plus)) return { ok: false, reason: 'plus' }
      state = {
        ...state,
        progress: {
          ...state.progress,
          nest: {
            habitat: habitat || state.progress.nest.habitat,
            skin: skin || state.progress.nest.skin
          }
        }
      }
      emit()
      return { ok: true }
    }
  }
}

export const store = createStore()
