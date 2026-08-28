<template>
  <section class="stack">
    <div class="row between top">
      <div>
        <p class="tiny neon-text">GAME LOCKER</p>
        <h1>Drop in.</h1>
      </div>
      <span class="chip neon">{{ rank.name }} · {{ rank.difficulty }}</span>
    </div>

    <div class="card energy-card" :class="{ dry: !view.plus && remaining <= 0 }">
      <p class="tiny muted">TODAY’S ENERGY</p>
      <div class="energy-num" v-if="view.plus">
        <b>∞</b><span>UNLIMITED · PLUS</span>
      </div>
      <div class="energy-num" v-else>
        <b>{{ remaining }}</b><span>/ {{ limit }} runs</span>
      </div>
      <div class="pips" v-if="!view.plus">
        <i class="pip" v-for="n in limit" :key="n" :class="{ on: n <= remaining }"></i>
      </div>
      <p class="tiny" :class="energyToneClass">{{ energyLine }}</p>
    </div>

    <button
      type="button"
      class="card contract"
      :class="{ done: contractDone }"
      v-if="contract"
      @click="open(contract.game || 'riftDelve')"
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

    <div class="card rank-banner">
      <div class="row between">
        <span class="tiny neon-text">EXPLORE XP {{ exploreXp }}</span>
        <span class="tiny muted">best depth {{ view.progress.bestDepth || 0 }}</span>
      </div>
      <div class="xp-track big"><i :style="{ width: rankPct + '%' }"></i></div>
      <p class="tiny muted" v-if="view.nextDelve">{{ xpToNext }} XP → {{ view.nextDelve.name }} · unlocks {{ view.nextDelve.difficulty }}</p>
      <p class="tiny neon-text" v-else>Mythic unlocked. You run the Rift.</p>
    </div>

    <div class="card stack game-card" :class="{ featured: game.featured }" v-for="game in games" :key="game.id">
      <span class="ribbon" v-if="game.featured">FEATURED</span>
      <div class="row between">
        <h3>{{ game.title }}</h3>
        <span class="chip" v-if="!game.featured">best {{ view.progress.highScores[game.id] || 0 }}</span>
      </div>
      <p class="tiny neon-text" v-if="game.featured && biome">TODAY’S ZONE · {{ biome.name }}</p>
      <p class="muted">{{ game.featured && biome ? biome.flavour : game.blurb }}</p>
      <p class="small muted" v-if="game.featured">Rank earned here unlocks Wild and Insane everywhere else.</p>
      <button class="btn primary wide" :class="{ giant: game.featured }" @click="open(game.id)">{{ game.cta }}</button>
    </div>

    <p class="tiny muted center">No ads. No loot boxes. Rank is earned in the Rift, never bought.</p>

    <div class="overlay" :class="{ play: isFull }" v-if="active">
      <div class="sheet stack" :class="{ 'game-sheet': isFull }">
        <div class="row between">
          <h2>{{ current.title }}</h2>
          <button class="btn ghost" style="padding:8px 12px" @click="active = null">X</button>
        </div>
        <RiftDelve v-if="active === 'riftDelve'" :explore-xp="exploreXp" @done="finish" />
        <NeonRush v-else-if="active === 'neonRush'" :explore-xp="exploreXp" @done="finish" />
        <StarCatch v-else-if="active === 'starCatch'" :explore-xp="exploreXp" @done="finish" />
        <GlowMemory v-else-if="active === 'glowMemory'" @done="finish" />
        <WordSpark v-else-if="active === 'wordSpark'" @done="finish" />
        <button v-if="!isFull" class="btn ghost wide" @click="active = null">Close</button>
      </div>
    </div>
  </section>
</template>

<script>
import StarCatch from './games/StarCatch.vue'
import GlowMemory from './games/GlowMemory.vue'
import WordSpark from './games/WordSpark.vue'
import RiftDelve from './games/RiftDelve.vue'
import NeonRush from './games/NeonRush.vue'

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
  name: 'ArcadeView',
  components: { StarCatch, GlowMemory, WordSpark, RiftDelve, NeonRush },
  inject: ['game', 'store'],
  emits: ['need-plus', 'celebrated'],
  data() {
    return {
      active: null,
      games: [
        { id: 'riftDelve', title: 'Rift Delve', featured: true, cta: 'ENTER THE RIFT', blurb: 'Top-down cave raid. Mine glow-ore, outrun shadow mites, push deeper. Rank earned here unlocks Wild and Insane everywhere else.' },
        { id: 'neonRush', title: 'Neon Rush', cta: 'DASH', blurb: 'Three-lane sprint. Speed scales with your delve rank.' },
        { id: 'starCatch', title: 'Star Catch', cta: 'PLAY', blurb: 'Tap falling lanterns. Faster storms at higher ranks.' },
        { id: 'glowMemory', title: 'Glow Memory', cta: 'PLAY', blurb: 'Copy Luma’s light pattern.' },
        { id: 'wordSpark', title: 'Word Spark', cta: 'PLAY', blurb: 'Unscramble today’s ember-word.' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    rank() { return this.view.delveRank || { name: 'Scout', difficulty: 'Chill', xp: 0 } },
    exploreXp() { return this.view.progress.exploreXp || 0 },
    limit() {
      const limit = this.view.limits?.arcade ?? 2
      return Number.isFinite(limit) ? limit : 2
    },
    remaining() {
      const used = this.view.counters?.arcadePlaysToday || 0
      return Math.max(0, this.limit - used)
    },
    energyLine() {
      if (this.view.plus) return 'Run it until your thumbs quit.'
      if (this.remaining <= 0) return 'Tank’s empty. Refills at midnight — or go Plus.'
      if (this.remaining === 1) return 'Last run of the day. Make it count.'
      return 'Free drops get a couple of runs a day.'
    },
    energyToneClass() {
      if (this.view.plus) return 'neon-text'
      return this.remaining <= 0 ? 'warn' : 'neon-text'
    },
    current() { return this.games.find((g) => g.id === this.active) || {} },
    isFull() { return this.active === 'riftDelve' },
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
    biome() { return this.view?.dailyBiome || null },
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
      if (this.contractDone) return reward ? `Cleared. ${reward} banked.` : 'Cleared. Keep delving anyway.'
      const bits = ['tap to run it']
      if (this.contractTarget !== null && this.contractCurrent !== null) {
        bits.unshift(`${this.contractCurrent} / ${this.contractTarget}`)
      }
      if (reward) bits.push(reward)
      return bits.join(' · ')
    }
  },
  methods: {
    open(id) {
      if (this.view.gated?.arcade) {
        this.$emit('need-plus', 'Free drops get two arcade runs a day. Plus is unlimited energy.')
        return
      }
      this.active = id
    },
    finish(payload) {
      const extra = payload && typeof payload === 'object' ? payload : {}
      const score = typeof payload === 'number' ? payload : extra.score
      try {
        this.store.playArcade(this.active, score, extra)
      } finally {
        this.active = null
        this.$emit('celebrated')
      }
    }
  }
}
</script>
