<template>
  <section class="stack">
    <h1>Arcade</h1>
    <p class="muted">Cozy, short, and safe — no ads, no loot boxes, no cash-out. Just light.</p>
    <div class="card">
      <p class="tiny muted">Today’s energy</p>
      <h2 v-if="view.plus">Unlimited</h2>
      <h2 v-else>{{ remaining }} / {{ view.limits?.arcade ?? 2 }} plays</h2>
    </div>
    <div class="card stack" v-for="game in games" :key="game.id">
      <div class="row" style="justify-content: space-between;">
        <h3>{{ game.title }}</h3>
        <span class="chip">best {{ view.progress.highScores[game.id] || 0 }}</span>
      </div>
      <p class="muted">{{ game.blurb }}</p>
      <button class="btn primary wide" @click="open(game.id)">Play</button>
    </div>

    <div class="overlay" v-if="active" @click.self="active = null">
      <div class="sheet stack">
        <h2>{{ current.title }}</h2>
        <StarCatch v-if="active === 'starCatch'" @done="finish" />
        <GlowMemory v-else-if="active === 'glowMemory'" @done="finish" />
        <WordSpark v-else-if="active === 'wordSpark'" @done="finish" />
        <button class="btn ghost wide" @click="active = null">Close</button>
      </div>
    </div>
  </section>
</template>

<script>
import StarCatch from './games/StarCatch.vue'
import GlowMemory from './games/GlowMemory.vue'
import WordSpark from './games/WordSpark.vue'

export default {
  name: 'ArcadeView',
  components: { StarCatch, GlowMemory, WordSpark },
  inject: ['game', 'store'],
  emits: ['need-plus', 'celebrated'],
  data() {
    return {
      active: null,
      games: [
        { id: 'starCatch', title: 'Star Catch', blurb: 'Tap falling lanterns for 30 seconds.' },
        { id: 'glowMemory', title: 'Glow Memory', blurb: 'Copy Luma’s light pattern.' },
        { id: 'wordSpark', title: 'Word Spark', blurb: 'Unscramble today’s ember-word.' }
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
    current() { return this.games.find((g) => g.id === this.active) || {} }
  },
  methods: {
    open(id) {
      if (this.view.gated?.arcade) {
        this.$emit('need-plus', 'Free fireflies get two arcade plays a day. Plus never runs out of energy.')
        return
      }
      this.active = id
    },
    finish(score) {
      try {
        this.store.playArcade(this.active, score)
      } finally {
        this.active = null
        this.$emit('celebrated')
      }
    }
  }
}
</script>
