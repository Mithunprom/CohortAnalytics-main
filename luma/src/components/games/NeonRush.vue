<template>
  <div class="stack">
    <div class="row" style="justify-content: space-between;">
      <span class="chip neon">{{ seconds }}s</span>
      <span class="chip">{{ difficulty }} ×{{ speed.toFixed(2) }}</span>
      <span class="chip">{{ score }}</span>
    </div>
    <div class="rush" ref="stage" @pointerdown="nudge">
      <div class="rush-lane" v-for="n in 3" :key="n"></div>
      <div class="rush-player" :style="{ left: `calc(${16 + lane * 33}% - 14px)` }"></div>
      <div
        v-for="bit in bits"
        :key="bit.id"
        class="rush-bit"
        :class="bit.kind"
        :style="{ left: `calc(${16 + bit.lane * 33}% - 12px)`, top: bit.y + 'px' }"
      ></div>
    </div>
    <div class="row">
      <button type="button" class="btn ghost wide" @pointerdown.prevent="lane = Math.max(0, lane - 1)">◀ LEFT</button>
      <button type="button" class="btn ghost wide" @pointerdown.prevent="lane = Math.min(2, lane + 1)">RIGHT ▶</button>
    </div>
  </div>
</template>

<script>
import { rankFromXp } from '../../engine/delve.js'

export default {
  name: 'NeonRush',
  emits: ['done'],
  props: {
    exploreXp: { type: Number, default: 0 }
  },
  data() {
    return {
      lane: 1,
      score: 0,
      seconds: 40,
      bits: [],
      nextId: 1,
      timers: [],
      ended: false
    }
  },
  computed: {
    rank() { return rankFromXp(this.exploreXp) },
    speed() { return this.rank.rushSpeed },
    difficulty() { return this.rank.difficulty }
  },
  mounted() {
    this.timers.push(setInterval(this.tick, 1000))
    this.timers.push(setInterval(this.spawn, Math.max(280, 640 / this.speed)))
    this.timers.push(setInterval(this.step, 32))
    window.addEventListener('keydown', this.onKey)
  },
  unmounted() {
    this.timers.forEach(clearInterval)
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    onKey(e) {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.lane = Math.max(0, this.lane - 1)
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.lane = Math.min(2, this.lane + 1)
    },
    nudge(e) {
      const box = this.$refs.stage.getBoundingClientRect()
      this.lane = e.clientX < box.left + box.width / 2 ? Math.max(0, this.lane - 1) : Math.min(2, this.lane + 1)
    },
    spawn() {
      const kind = Math.random() < 0.62 ? 'block' : 'shard'
      this.bits.push({
        id: this.nextId++,
        lane: Math.floor(Math.random() * 3),
        y: -24,
        kind
      })
    },
    step() {
      const h = this.$refs.stage?.clientHeight || 280
      const next = []
      for (const bit of this.bits) {
        const y = bit.y + 3.4 * this.speed
        const hit = y > h - 78 && y < h - 28 && bit.lane === this.lane
        if (hit && bit.kind === 'shard') {
          this.score += 8
          continue
        }
        if (hit && bit.kind === 'block') {
          this.finish(Math.max(0, this.score - 12))
          return
        }
        if (y < h) next.push({ ...bit, y })
        else if (bit.kind === 'block') this.score += 2
      }
      this.bits = next
    },
    tick() {
      if (this.ended) return
      this.seconds -= 1
      if (this.seconds <= 0) this.finish(this.score + 20)
    },
    finish(score) {
      if (this.ended) return
      this.ended = true
      this.timers.forEach(clearInterval)
      this.$emit('done', { score, exploreXp: Math.round(score / 8) })
    }
  }
}
</script>
