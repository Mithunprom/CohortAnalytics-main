<template>
  <div class="delve">
    <div class="delve-hud">
      <span class="chip neon">{{ seconds }}s</span>
      <span class="chip">d{{ depth }} · {{ zone }}</span>
      <span class="chip">ore {{ ores }}</span>
      <span class="chip hp">♥ {{ hp }}</span>
    </div>
    <canvas
      ref="canvas"
      class="delve-canvas"
      @pointerdown="onPointer"
      @pointermove="onPointer"
      @pointerup="endPointer"
      @pointercancel="endPointer"
    ></canvas>
    <div class="delve-pads">
      <div class="dpad">
        <button type="button" class="pad-btn" @pointerdown.prevent="hold('y', -1)" @pointerup.prevent="hold('y', 0)" @pointerleave.prevent="hold('y', 0)">▲</button>
        <div class="dpad-mid">
          <button type="button" class="pad-btn" @pointerdown.prevent="hold('x', -1)" @pointerup.prevent="hold('x', 0)" @pointerleave.prevent="hold('x', 0)">◀</button>
          <button type="button" class="pad-btn mine" @pointerdown.prevent="mining = true" @pointerup.prevent="mining = false" @pointerleave.prevent="mining = false">MINE</button>
          <button type="button" class="pad-btn" @pointerdown.prevent="hold('x', 1)" @pointerup.prevent="hold('x', 0)" @pointerleave.prevent="hold('x', 0)">▶</button>
        </div>
        <button type="button" class="pad-btn" @pointerdown.prevent="hold('y', 1)" @pointerup.prevent="hold('y', 0)" @pointerleave.prevent="hold('y', 0)">▼</button>
      </div>
      <p class="tiny muted">WASD / pads to move. Hold MINE on a wall. Light keeps shadow mites off you.</p>
      <button type="button" class="btn ghost wide" @click="end">EXTRACT / CASH OUT</button>
    </div>
  </div>
</template>

<script>
import {
  generateCave,
  TILE,
  TILE_HP,
  SPAWN,
  MAP_W,
  MAP_H,
  tileIndex,
  canMineTile,
  depthFrom,
  zoneDifficulty,
  scoreRun,
  exploreXpFrom,
  rankFromXp
} from '../../engine/delve.js'

const COLORS = {
  [TILE.AIR]: '#14101f',
  [TILE.SOIL]: '#6b3f24',
  [TILE.STONE]: '#3a3d55',
  [TILE.HARD]: '#23263a',
  [TILE.ORE]: '#ffd23f',
  [TILE.CRYSTAL]: '#3dffd2',
  [TILE.BEDROCK]: '#09070f'
}

export default {
  name: 'RiftDelve',
  emits: ['done'],
  props: {
    exploreXp: { type: Number, default: 0 }
  },
  data() {
    const cave = generateCave(Date.now() % 1_000_000)
    return {
      cave,
      hpMap: cave.tiles.map((t) => TILE_HP[t]),
      px: SPAWN.x + 0.5,
      py: SPAWN.y + 0.5,
      vx: 0,
      vy: 0,
      keys: { x: 0, y: 0 },
      mining: false,
      mineTick: 0,
      revealed: {},
      ores: 0,
      crystals: 0,
      hp: 3,
      seconds: 80,
      mites: cave.mites.map((m) => ({ ...m, fx: m.x + 0.5, fy: m.y + 0.5 })),
      hitFlash: 0,
      raf: 0,
      last: 0,
      timers: [],
      ended: false
    }
  },
  computed: {
    rank() { return rankFromXp(this.exploreXp) },
    depth() { return depthFrom(Math.floor(this.px), Math.floor(this.py)) },
    zone() { return zoneDifficulty(this.depth) }
  },
  mounted() {
    this.resize()
    window.addEventListener('resize', this.resize)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKeyUp)
    this.revealAround()
    this.last = performance.now()
    this.loop(this.last)
    this.timers.push(setInterval(() => {
      if (this.ended) return
      this.seconds -= 1
      if (this.seconds <= 0) this.end()
    }, 1000))
  },
  unmounted() {
    cancelAnimationFrame(this.raf)
    this.timers.forEach(clearInterval)
    window.removeEventListener('resize', this.resize)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKeyUp)
  },
  methods: {
    hold(axis, value) {
      this.keys[axis] = value
    },
    onKey(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft') this.keys.x = -1
      if (k === 'd' || k === 'arrowright') this.keys.x = 1
      if (k === 'w' || k === 'arrowup') this.keys.y = -1
      if (k === 's' || k === 'arrowdown') this.keys.y = 1
      if (k === ' ' || k === 'e') this.mining = true
    },
    onKeyUp(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft' || k === 'd' || k === 'arrowright') this.keys.x = 0
      if (k === 'w' || k === 'arrowup' || k === 's' || k === 'arrowdown') this.keys.y = 0
      if (k === ' ' || k === 'e') this.mining = false
    },
    onPointer() {},
    endPointer() {},
    resize() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.floor(rect.width * dpr))
      canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    },
    tile(x, y) {
      if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) return TILE.BEDROCK
      return this.cave.tiles[tileIndex(x, y)]
    },
    setTile(x, y, value) {
      this.cave.tiles[tileIndex(x, y)] = value
      this.hpMap[tileIndex(x, y)] = TILE_HP[value]
    },
    blocked(x, y) {
      return this.tile(Math.floor(x), Math.floor(y)) !== TILE.AIR
    },
    revealAround() {
      const r = this.rank.light
      const cx = Math.floor(this.px)
      const cy = Math.floor(this.py)
      for (let y = cy - 8; y <= cy + 8; y++) {
        for (let x = cx - 8; x <= cx + 8; x++) {
          const d = Math.hypot(x + 0.5 - this.px, y + 0.5 - this.py)
          if (d <= r + 0.4) this.revealed[`${x},${y}`] = true
        }
      }
    },
    tryMove(dt) {
      const speed = 3.4 + this.rank.id * 0.35
      let nx = this.px + this.keys.x * speed * dt
      let ny = this.py + this.keys.y * speed * dt
      if (!this.blocked(nx, this.py)) this.px = nx
      if (!this.blocked(this.px, ny)) this.py = ny
    },
    facing() {
      let fx = Math.round(this.keys.x)
      let fy = Math.round(this.keys.y)
      if (!fx && !fy) fy = -1
      return { x: Math.floor(this.px) + fx, y: Math.floor(this.py) + fy }
    },
    tryMine(dt) {
      if (!this.mining) return
      this.mineTick += dt
      if (this.mineTick < 0.18) return
      this.mineTick = 0
      const { x, y } = this.facing()
      const t = this.tile(x, y)
      if (!canMineTile(t, this.rank.minePower)) return
      const i = tileIndex(x, y)
      this.hpMap[i] -= 1
      if (this.hpMap[i] <= 0) {
        if (t === TILE.ORE) this.ores += 1
        if (t === TILE.CRYSTAL) this.crystals += 1
        this.setTile(x, y, TILE.AIR)
      }
    },
    moveMites(dt) {
      const lit = this.rank.light
      for (const mite of this.mites) {
        const dist = Math.hypot(mite.fx - this.px, mite.fy - this.py)
        const zone = zoneDifficulty(depthFrom(Math.floor(mite.fx), Math.floor(mite.fy)))
        const aggro = zone === 'Chill' ? 0 : zone === 'Amped' ? 0.7 : zone === 'Wild' ? 1.1 : 1.6
        if (dist < 0.55) {
          this.hurt()
          mite.fx += (mite.fx - this.px) * 0.8
          mite.fy += (mite.fy - this.py) * 0.8
          continue
        }
        if (dist < lit - 0.6) continue
        const speed = 1.1 * aggro
        mite.fx += ((this.px - mite.fx) / Math.max(dist, 0.01)) * speed * dt
        mite.fy += ((this.py - mite.fy) / Math.max(dist, 0.01)) * speed * dt
      }
    },
    hurt() {
      if (this.hitFlash > 0 || this.ended) return
      this.hp -= 1
      this.hitFlash = 0.7
      if (this.hp <= 0) this.end()
    },
    end() {
      if (this.ended) return
      this.ended = true
      cancelAnimationFrame(this.raf)
      const revealed = Object.keys(this.revealed).length
      const depth = this.depth
      const payload = {
        score: scoreRun({ revealed, ores: this.ores, crystals: this.crystals, depth, hp: this.hp }),
        exploreXp: exploreXpFrom({ revealed, ores: this.ores, crystals: this.crystals, depth }),
        depth,
        ores: this.ores,
        crystals: this.crystals
      }
      this.$emit('done', payload)
    },
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.hitFlash = Math.max(0, this.hitFlash - dt)
      this.tryMove(dt)
      this.tryMine(dt)
      this.moveMites(dt)
      this.revealAround()
      this.draw()
      if (!this.ended) this.raf = requestAnimationFrame(this.loop)
    },
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      const w = canvas.width
      const h = canvas.height
      const tile = Math.floor(Math.min(w, h) / 11)
      ctx.fillStyle = '#07060c'
      ctx.fillRect(0, 0, w, h)
      const camX = this.px * tile - w / 2
      const camY = this.py * tile - h / 2
      const light = this.rank.light * tile

      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          if (!this.revealed[`${x},${y}`]) continue
          const sx = Math.floor(x * tile - camX)
          const sy = Math.floor(y * tile - camY)
          if (sx < -tile || sy < -tile || sx > w || sy > h) continue
          const t = this.tile(x, y)
          ctx.fillStyle = COLORS[t]
          ctx.fillRect(sx, sy, tile - 1, tile - 1)
          if (t === TILE.ORE || t === TILE.CRYSTAL) {
            ctx.fillStyle = t === TILE.ORE ? '#fff1a8' : '#e9fff9'
            ctx.fillRect(sx + tile * 0.3, sy + tile * 0.3, tile * 0.35, tile * 0.35)
          }
        }
      }

      const shade = ctx.createRadialGradient(w / 2, h / 2, tile * 0.6, w / 2, h / 2, light)
      shade.addColorStop(0, 'rgba(255, 230, 120, 0.08)')
      shade.addColorStop(0.55, 'rgba(8, 6, 16, 0.15)')
      shade.addColorStop(1, 'rgba(4, 3, 10, 0.78)')
      ctx.fillStyle = shade
      ctx.fillRect(0, 0, w, h)

      for (const mite of this.mites) {
        if (!this.revealed[`${Math.floor(mite.fx)},${Math.floor(mite.fy)}`]) continue
        const mx = mite.fx * tile - camX
        const my = mite.fy * tile - camY
        ctx.fillStyle = '#ff2bd6'
        ctx.beginPath()
        ctx.arc(mx, my, tile * 0.28, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.fillStyle = this.hitFlash > 0 ? '#ffffff' : '#c8ff3d'
      ctx.shadowColor = '#c8ff3d'
      ctx.shadowBlur = 18
      ctx.beginPath()
      ctx.arc(w / 2, h / 2, tile * 0.34, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }
}
</script>
