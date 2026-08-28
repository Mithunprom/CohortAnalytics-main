<template>
  <section class="stack">
    <div class="card rank-banner">
      <div class="row between top">
        <div>
          <p class="tiny neon-text">{{ greeting }}</p>
          <h1>{{ rank.name }}</h1>
          <p class="tiny muted">{{ name }} · {{ rank.difficulty }} unlocked</p>
        </div>
        <button type="button" class="luma-mini plain-luma" @click="$emit('open-nest')" aria-label="Open Luma’s nest">
          <LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" :mood="lumaMood" />
        </button>
      </div>
      <div class="xp-track big"><i :style="{ width: rankPct + '%' }"></i></div>
      <div class="row between">
        <span class="tiny neon-text">{{ exploreXp }} XP</span>
        <span class="tiny muted" v-if="view.nextDelve">{{ xpToNext }} XP → {{ view.nextDelve.name }}</span>
        <span class="tiny neon-text" v-else>MYTHIC. YOU RUN THE RIFT.</span>
      </div>
      <div class="row wrap">
        <span class="chip">★ {{ streak }} day streak</span>
        <span class="chip">▼ depth {{ bestDepth }}</span>
        <span class="chip" :class="{ neon: view.plus }">{{ energyLabel }}</span>
      </div>
    </div>

    <button type="button" class="card featured-drop stack" :style="dropStyle" @click="$emit('open-play')">
      <span class="ribbon">TODAY</span>
      <p class="tiny neon-text">TODAY’S DROP · RIFT DELVE</p>
      <h2 class="drop-title">{{ dropName }}</h2>
      <p class="muted">{{ dropFlavour }}</p>
      <span class="btn primary wide giant">ENTER THE RIFT</span>
      <p class="tiny muted center">{{ ctaFooter }}</p>
    </button>

    <button
      type="button"
      class="card contract"
      :class="{ done: contractDone }"
      v-if="contract"
      @click="$emit('open-play')"
    >
      <div class="row between">
        <p class="tiny" :class="contractDone ? 'neon-text' : 'muted'">DAILY CONTRACT</p>
        <span class="stamp" v-if="contractDone">COMPLETE</span>
        <span class="chip" v-else>{{ contractVibe }}</span>
      </div>
      <h3>{{ contract.title || 'Unnamed contract' }}</h3>
      <p class="muted" v-if="contractGoal">{{ contractGoal }}</p>
      <div class="xp-track" v-if="contractPct !== null"><i :style="{ width: contractPct + '%' }"></i></div>
      <p class="tiny" :class="contractDone ? 'neon-text' : 'muted'">{{ contractFooter }}</p>
    </button>

    <div class="card mission">
      <div class="row between">
        <p class="tiny muted">SIDE MISSION · SPARK</p>
        <span class="chip" :class="{ neon: sparkDone }">{{ sparkDone ? 'DONE' : category.label }}</span>
      </div>
      <h3>{{ view.quest.title }}</h3>
      <p class="small muted">{{ view.quest.prompt }}</p>
      <button class="btn sm" :class="sparkDone ? 'ghost' : 'primary'" @click="$emit('open-spark')">
        {{ sparkDone ? 'RUN IT AGAIN' : 'TAKE 60 SECONDS' }}
      </button>
    </div>

    <div class="card stack tight">
      <p class="tiny muted">SIGNAL CHECK · JUST FOR YOU</p>
      <div class="mood-row">
        <button
          v-for="mood in moods"
          :key="mood.id"
          class="mood-dot"
          :class="{ picked: moodPicked === mood.id }"
          :aria-label="mood.label"
          :title="mood.label"
          @click="store.setMood(mood.id)"
        >{{ mood.face }}</button>
      </div>
    </div>
  </section>
</template>

<script>
import LumaCreature from './LumaCreature.vue'
import { CATEGORIES } from '../engine/quests.js'

const KIND_LABEL = {
  depth: 'depth',
  ore: 'glow-ore',
  ores: 'glow-ore',
  crystal: 'crystals',
  crystals: 'crystals',
  xp: 'explore XP',
  exploreXp: 'explore XP',
  score: 'score',
  runs: 'runs',
  mites: 'mites dodged'
}

export default {
  name: 'HomeView',
  components: { LumaCreature },
  inject: ['game', 'store'],
  emits: ['open-spark', 'open-nest', 'open-play'],
  data() {
    return {
      moods: [
        { id: 'glow', face: '✦', label: 'Glowing' },
        { id: 'calm', face: '☾', label: 'Calm' },
        { id: 'meh', face: '—', label: 'Flat' },
        { id: 'storm', face: '☁', label: 'Stormy' },
        { id: 'spark', face: '★', label: 'Wired' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    name() { return this.view.profile.name || 'friend' },
    rank() { return this.view.delveRank || { name: 'Scout', difficulty: 'Chill', xp: 0 } },
    exploreXp() { return this.view.progress.exploreXp || 0 },
    streak() { return this.view.progress.streak || 0 },
    bestDepth() { return this.view.progress.bestDepth || 0 },
    greeting() {
      const h = new Date().getHours()
      if (h < 12) return 'MORNING DROP'
      if (h < 18) return 'AFTERNOON QUEUE'
      return 'NIGHT RAID'
    },
    rankPct() {
      const cur = this.view.delveRank
      const nxt = this.view.nextDelve
      if (!nxt || !cur) return 100
      const span = nxt.xp - cur.xp
      return Math.min(100, Math.round(((this.exploreXp - cur.xp) / Math.max(1, span)) * 100))
    },
    xpToNext() {
      if (!this.view.nextDelve) return 0
      return Math.max(0, this.view.nextDelve.xp - this.exploreXp)
    },
    energyLeft() {
      const used = this.view.counters?.arcadePlaysToday || 0
      const limit = this.view.limits?.arcade ?? 2
      return Math.max(0, limit - used)
    },
    energyLabel() {
      if (this.view.plus) return '◆ unlimited energy'
      return `◆ ${this.energyLeft} run${this.energyLeft === 1 ? '' : 's'} left`
    },
    ctaFooter() {
      if (this.view.plus) return 'Plus · unlimited runs'
      if (this.energyLeft <= 0) return 'Out of energy today — Plus keeps it open'
      return `${this.energyLeft} of ${this.view.limits?.arcade ?? 2} runs left today`
    },
    biome() { return this.view?.dailyBiome || null },
    dropName() { return this.biome?.name || 'Rift Delve' },
    dropFlavour() {
      return this.biome?.flavour || 'Mine glow-ore, outrun the mites, go deeper than yesterday.'
    },
    dropStyle() {
      return this.biome?.accent ? { '--accent': this.biome.accent } : {}
    },
    contract() { return this.view?.dailyContract || null },
    contractDone() { return Boolean(this.view?.contractDone || this.contract?.done) },
    contractTarget() {
      const c = this.contract || {}
      const n = Number(c.goal ?? c.target)
      return Number.isFinite(n) && n > 0 ? n : null
    },
    contractCurrent() {
      const c = this.contract
      if (!c) return null
      const found = [c.value, c.raw, c.progress, c.current, c.count].find((v) => typeof v === 'number')
      return typeof found === 'number' ? found : null
    },
    contractPct() {
      const c = this.contract
      if (!c) return null
      if (this.contractDone) return 100
      if (typeof c.pct === 'number') return Math.max(0, Math.min(100, Math.round(c.pct)))
      if (this.contractTarget === null || this.contractCurrent === null) return null
      return Math.min(100, Math.round((this.contractCurrent / this.contractTarget) * 100))
    },
    contractGoal() {
      const c = this.contract
      if (!c) return ''
      if (c.blurb) return c.blurb
      if (this.contractTarget === null) return ''
      const unit = c.unit || KIND_LABEL[c.metric] || KIND_LABEL[c.kind] || c.kind || ''
      return `Hit ${this.contractTarget}${unit ? ' ' + unit : ''} in one run.`
    },
    contractVibe() {
      const pct = this.contractPct
      if (pct === null) return 'OPEN'
      if (pct <= 0) return 'UNTOUCHED'
      if (pct < 50) return 'WARMING UP'
      if (pct < 100) return 'ALMOST'
      return 'FINISH IT'
    },
    contractFooter() {
      const reward = typeof this.contract?.xp === 'number' ? `+${this.contract.xp} XP` : ''
      if (this.contractDone) return reward ? `Cleared. ${reward} banked.` : 'Cleared. Rift’s still open.'
      const bits = []
      if (this.contractTarget !== null && this.contractCurrent !== null) {
        bits.push(`${this.contractCurrent} / ${this.contractTarget}`)
      }
      if (reward) bits.push(`${reward} on clear`)
      bits.push('resets at midnight')
      return bits.join(' · ')
    },
    category() { return CATEGORIES[this.view.quest?.category] || CATEGORIES.play },
    sparkDone() { return Boolean(this.view.progress.constellation[this.view.today]) },
    moodPicked() {
      if (this.view.progress.lastMoodDate !== this.view.today) return null
      return this.view.progress.moodToday
    },
    lumaMood() {
      if (this.contractDone || this.sparkDone) return 'happy'
      if (this.streak >= 3) return 'happy'
      return 'idle'
    }
  }
}
</script>
