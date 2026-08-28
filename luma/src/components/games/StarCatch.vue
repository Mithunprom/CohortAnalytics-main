<template>
  <div class="stack">
    <div class="row" style="justify-content: space-between;">
      <span class="chip">{{ seconds }}s</span>
      <span class="chip" v-if="streak > 1">{{ streak }} in a row</span>
      <span class="chip">{{ score }} caught</span>
    </div>
    <div class="game-stage catch-stage" :class="{ hot: streak >= 5 }" ref="stage">
      <button
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="{ left: star.x + 'px', top: star.y + 'px' }"
        @pointerdown.prevent="catchStar(star.id)"
      ></button>
      <span
        v-for="pop in pops"
        :key="pop.id"
        class="catch-pop"
        :style="{ left: pop.x + 'px', top: pop.y + 'px' }"
      >{{ pop.text }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StarCatch',
  emits: ['done'],
  props: {
    exploreXp: { type: Number, default: 0 }
  },
  data() {
    return { stars: [], pops: [], score: 0, streak: 0, bestStreak: 0, seconds: 30, nextId: 1, timers: [] }
  },
  computed: {
    speed() {
      const xp = this.exploreXp || 0
      if (xp >= 320) return 1.85
      if (xp >= 140) return 1.5
      if (xp >= 50) return 1.25
      return 1
    }
  },
  mounted() {
    this.spawn()
    this.timers.push(setInterval(this.tick, 1000))
    this.timers.push(setInterval(this.spawn, Math.max(280, 700 / this.speed)))
    this.timers.push(setInterval(this.fall, 50))
  },
  unmounted() {
    this.timers.forEach(clearInterval)
  },
  methods: {
    bounds() {
      const el = this.$refs.stage
      return { w: el?.clientWidth || 300, h: el?.clientHeight || 280 }
    },
    spawn() {
      const { w } = this.bounds()
      this.stars.push({
        id: this.nextId++,
        x: Math.random() * Math.max(20, w - 40),
        y: -20
      })
    },
    fall() {
      const { h } = this.bounds()
      let dropped = 0
      const kept = []
      for (const s of this.stars) {
        const y = s.y + 2.6 * this.speed
        if (y < h) kept.push({ ...s, y })
        else dropped += 1
      }
      this.stars = kept
      if (dropped) this.streak = 0
      this.pops = this.pops
        .map((p) => ({ ...p, y: p.y - 2.4, life: p.life - 1 }))
        .filter((p) => p.life > 0)
    },
    catchStar(id) {
      const star = this.stars.find((s) => s.id === id)
      this.stars = this.stars.filter((s) => s.id !== id)
      this.score += 1
      this.streak += 1
      this.bestStreak = Math.max(this.bestStreak, this.streak)
      if (star) {
        this.pops.push({
          id: this.nextId++,
          x: star.x,
          y: star.y,
          text: this.streak >= 3 ? `${this.streak}x` : '+1',
          life: 14
        })
        if (this.pops.length > 8) this.pops.shift()
      }
    },
    tick() {
      if (this.seconds <= 1) {
        this.seconds = 0
        this.timers.forEach(clearInterval)
        this.$emit('done', this.score)
        return
      }
      this.seconds -= 1
    }
  }
}
</script>

<style scoped>
.catch-stage { position: relative; transition: box-shadow 0.25s ease; }
.catch-stage.hot { box-shadow: inset 0 0 42px rgba(61, 255, 210, 0.22); }
.catch-pop {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  color: #3dffd2;
  text-shadow: 0 0 8px currentColor;
  pointer-events: none;
}
</style>
