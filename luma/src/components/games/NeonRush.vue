<template>
  <div class="stack">
    <div class="row" style="justify-content: space-between;">
      <span class="chip neon">{{ seconds }}s</span>
      <span class="chip">{{ difficulty }} ×{{ speed.toFixed(2) }}</span>
      <span class="chip" v-if="combo > 1">{{ combo }}x</span>
      <span class="chip">{{ score }}</span>
    </div>
    <div class="rush" ref="stage" @pointerdown="nudge">
      <div class="rush-lane" v-for="n in 3" :key="n"></div>
      <div
        v-for="ghost in trail"
        :key="ghost.id"
        class="rush-ghost"
        :style="{ left: `calc(${16 + ghost.lane * 33}% - 14px)`, opacity: ghost.alpha }"
      ></div>
      <div class="rush-player" :class="{ charged: combo >= 3 }" :style="{ left: `calc(${16 + lane * 33}% - 14px)` }"></div>
      <div
        v-for="bit in bits"
        :key="bit.id"
        class="rush-bit"
        :class="bit.kind"
        :style="{ left: `calc(${16 + bit.lane * 33}% - 12px)`, top: bit.y + 'px' }"
      ></div>
      <span
        v-for="pop in pops"
        :key="pop.id"
        class="rush-pop"
        :style="{ left: `calc(${16 + pop.lane * 33}% - 20px)`, top: pop.y + 'px', color: pop.color }"
      >{{ pop.text }}</span>
      <div class="rush-flash" v-if="flash"></div>
    </div>
    <div class="row">
      <button type="button" class="btn ghost wide" @pointerdown.prevent="moveLane(-1)">◀ LEFT</button>
      <button type="button" class="btn ghost wide" @pointerdown.prevent="moveLane(1)">RIGHT ▶</button>
    </div>
  </div>
</template>

<script>
import { rankFromXp, isNearMiss, NEAR_MISS_POINTS } from '../../engine/delve.js'

const SHARD_BASE = 8
const CRASH_PENALTY = 12

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
      trail: [],
      pops: [],
      combo: 0,
      comboMax: 0,
      nearMisses: 0,
      flash: false,
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
    if (this.exitTimer) clearTimeout(this.exitTimer)
    window.removeEventListener('keydown', this.onKey)
  },
  methods: {
    onKey(e) {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') this.moveLane(-1)
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') this.moveLane(1)
    },
    moveLane(dir) {
      if (this.ended) return
      this.lane = Math.max(0, Math.min(2, this.lane + dir))
    },
    nudge(e) {
      const box = this.$refs.stage.getBoundingClientRect()
      this.moveLane(e.clientX < box.left + box.width / 2 ? -1 : 1)
    },
    spawn() {
      if (this.ended) return
      const kind = Math.random() < 0.62 ? 'block' : 'shard'
      this.bits.push({
        id: this.nextId++,
        lane: Math.floor(Math.random() * 3),
        y: -24,
        kind,
        grazed: false
      })
    },
    pop(lane, y, text, color) {
      this.pops.push({ id: this.nextId++, lane, y, text, color, life: 16 })
      if (this.pops.length > 8) this.pops.shift()
    },
    step() {
      if (this.ended) return
      const h = this.$refs.stage?.clientHeight || 280
      const band = { top: h - 78, bottom: h - 28 }
      const next = []
      for (const bit of this.bits) {
        const y = bit.y + 3.4 * this.speed
        const inBand = y > band.top && y < band.bottom
        const hit = inBand && bit.lane === this.lane
        if (hit && bit.kind === 'shard') {
          this.combo += 1
          this.comboMax = Math.max(this.comboMax, this.combo)
          const gain = SHARD_BASE + Math.max(0, this.combo - 1) * 2
          this.score += gain
          this.pop(bit.lane, y, `+${gain}`, '#3dffd2')
          continue
        }
        if (hit && bit.kind === 'block') {
          this.crash()
          return
        }
        if (inBand && !bit.grazed && bit.kind === 'block' && isNearMiss(this.lane, bit.lane)) {
          bit.grazed = true
          this.nearMisses += 1
          this.score += NEAR_MISS_POINTS
          this.pop(bit.lane, y, 'graze', '#c8ff3d')
        }
        if (y < h) next.push({ ...bit, y })
        else if (bit.kind === 'block') this.score += 2
        else if (bit.kind === 'shard') this.combo = 0
      }
      this.bits = next

      this.trail = [{ id: this.nextId++, lane: this.lane, alpha: 0.42 }]
        .concat(this.trail.map((g) => ({ ...g, alpha: g.alpha * 0.62 })))
        .filter((g) => g.alpha > 0.04)
        .slice(0, 6)

      this.pops = this.pops
        .map((p) => ({ ...p, y: p.y - 2.2, life: p.life - 1 }))
        .filter((p) => p.life > 0)
    },
    tick() {
      if (this.ended) return
      this.seconds -= 1
      if (this.seconds <= 0) this.finish(this.score + 20)
    },
    crash() {
      if (this.ended) return
      this.ended = true
      this.combo = 0
      this.flash = true
      this.timers.forEach(clearInterval)
      const final = Math.max(0, this.score - CRASH_PENALTY)
      this.exitTimer = setTimeout(() => {
        this.flash = false
        this.emitDone(final)
      }, 340)
    },
    finish(score) {
      if (this.ended) return
      this.ended = true
      this.timers.forEach(clearInterval)
      this.emitDone(score)
    },
    emitDone(score) {
      this.$emit('done', {
        score,
        exploreXp: Math.round(score / 8),
        comboMax: this.comboMax,
        nearMisses: this.nearMisses
      })
    }
  }
}
</script>

<style scoped>
.rush-ghost {
  position: absolute;
  bottom: 36px;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--ember, #c8ff3d);
  filter: blur(2px);
  pointer-events: none;
}
.rush-player.charged {
  box-shadow: 0 0 18px 4px #3dffd2;
}
.rush-pop {
  position: absolute;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  width: 40px;
  text-align: center;
  pointer-events: none;
  text-shadow: 0 0 8px currentColor;
}
.rush-flash {
  position: absolute;
  inset: 0;
  background: #ff2bd6;
  opacity: 0.55;
  animation: rush-flash-out 340ms ease-out forwards;
  pointer-events: none;
}
@keyframes rush-flash-out {
  from { opacity: 0.7; }
  to { opacity: 0; }
}
</style>
