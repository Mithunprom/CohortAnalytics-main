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
        @click="catchStar(star.id)"
      ></button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StarCatch',
  emits: ['done'],
  data() {
    return { stars: [], score: 0, seconds: 30, nextId: 1, timers: [] }
  },
  mounted() {
    this.spawn()
    this.timers.push(setInterval(this.tick, 1000))
    this.timers.push(setInterval(this.spawn, 700))
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
        .map((s) => ({ ...s, y: s.y + 4 }))
        .filter((s) => s.y < h)
    },
    catchStar(id) {
      this.stars = this.stars.filter((s) => s.id !== id)
      this.score += 1
    },
    tick() {
      this.seconds -= 1
      if (this.seconds <= 0) {
        this.timers.forEach(clearInterval)
        this.$emit('done', this.score)
      }
    }
  }
}
</script>
