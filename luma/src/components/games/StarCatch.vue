<template>
  <div class="stack">
    <div class="row" style="justify-content: space-between;">
      <span class="chip">{{ seconds }}s</span>
      <span class="chip">{{ score }} caught</span>
    </div>
    <div class="game-stage" ref="stage">
      <button
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="{ left: star.x + 'px', top: star.y + 'px' }"
        @pointerdown.prevent="catchStar(star.id)"
      ></button>
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
    return { stars: [], score: 0, seconds: 30, nextId: 1, timers: [] }
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
      this.stars = this.stars
        .map((s) => ({ ...s, y: s.y + 2.6 * this.speed }))
        .filter((s) => s.y < h)
    },
    catchStar(id) {
      this.stars = this.stars.filter((s) => s.id !== id)
      this.score += 1
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
