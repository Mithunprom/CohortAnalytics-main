<template>
  <section class="stack">
    <div class="row" style="justify-content: space-between; align-items: flex-end;">
      <div>
        <p class="tiny neon-text">GAME LOCKER</p>
        <h1>Drop in.</h1>
      </div>
      <span class="chip neon">{{ view.delveRank?.name || 'Scout' }} · {{ view.delveRank?.difficulty }}</span>
    </div>
    <p class="muted">Explore the Rift to rank up. Higher rank = harder zones, stronger mine, faster Neon Rush. No ads. No loot boxes.</p>

    <div class="card rank-card">
      <div class="row" style="justify-content: space-between;">
        <span class="tiny">EXPLORE XP {{ view.progress.exploreXp || 0 }}</span>
        <span class="tiny muted">best depth {{ view.progress.bestDepth || 0 }}</span>
      </div>
      <div class="xp-track"><i :style="{ width: rankPct + '%' }"></i></div>
      <p class="tiny muted" v-if="view.nextDelve">Next {{ view.nextDelve.name }} at {{ view.nextDelve.xp }} xp · unlocks {{ view.nextDelve.difficulty }}</p>
      <p class="tiny neon-text" v-else>Mythic unlocked. You run the Rift.</p>
    </div>

    <div class="card">
      <p class="tiny muted">Today’s energy</p>
      <h2 v-if="view.plus">UNLIMITED</h2>
      <h2 v-else>{{ remaining }} / {{ view.limits?.arcade ?? 2 }}</h2>
    </div>

    <div class="card stack game-card" :class="{ featured: game.featured }" v-for="game in games" :key="game.id">
      <div class="row" style="justify-content: space-between;">
        <h3>{{ game.title }}</h3>
        <span class="chip" :class="{ neon: game.featured }">{{ game.featured ? 'FEATURED' : 'best ' + (view.progress.highScores[game.id] || 0) }}</span>
      </div>
      <p class="muted">{{ game.blurb }}</p>
      <button class="btn primary wide" @click="open(game.id)">{{ game.cta }}</button>
    </div>

    <div class="overlay" :class="{ play: isFull }" v-if="active">
      <div class="sheet stack" :class="{ 'game-sheet': isFull }">
        <div class="row" style="justify-content: space-between;">
          <h2>{{ current.title }}</h2>
          <button class="btn ghost" style="padding:8px 12px" @click="active = null">X</button>
        </div>
        <RiftDelve v-if="active === 'riftDelve'" :explore-xp="view.progress.exploreXp || 0" @done="finish" />
        <NeonRush v-else-if="active === 'neonRush'" :explore-xp="view.progress.exploreXp || 0" @done="finish" />
        <StarCatch v-else-if="active === 'starCatch'" :explore-xp="view.progress.exploreXp || 0" @done="finish" />
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

export default {
  name: 'ArcadeView',
  components: { StarCatch, GlowMemory, WordSpark, RiftDelve, NeonRush },
  inject: ['game', 'store'],
  emits: ['need-plus', 'celebrated'],
  data() {
    return {
      active: null,
      games: [
        { id: 'riftDelve', title: 'Rift Delve', featured: true, cta: 'ENTER THE RIFT', blurb: 'Top-down cave raid. Mine glow-ore, outrun shadow mites, push deeper. Rank earned here unlocks Wild/Insane everywhere.' },
        { id: 'neonRush', title: 'Neon Rush', cta: 'DASH', blurb: 'Three-lane sprint. Speed scales with your delve rank.' },
        { id: 'starCatch', title: 'Star Catch', cta: 'PLAY', blurb: 'Tap falling lanterns. Faster storms at higher ranks.' },
        { id: 'glowMemory', title: 'Glow Memory', cta: 'PLAY', blurb: 'Copy Luma’s light pattern.' },
        { id: 'wordSpark', title: 'Word Spark', cta: 'PLAY', blurb: 'Unscramble today’s ember-word.' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    remaining() {
      const used = this.view.counters?.arcadePlaysToday || 0
      const limit = this.view.limits?.arcade ?? 2
      return Math.max(0, limit - used)
    },
    current() { return this.games.find((g) => g.id === this.active) || {} },
    isFull() { return this.active === 'riftDelve' },
    rankPct() {
      const xp = this.view.progress.exploreXp || 0
      const cur = this.view.delveRank
      const nxt = this.view.nextDelve
      if (!nxt || !cur) return 100
      const span = nxt.xp - cur.xp
      return Math.min(100, Math.round(((xp - cur.xp) / Math.max(1, span)) * 100))
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
