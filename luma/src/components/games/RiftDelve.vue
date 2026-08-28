<template>
  <div class="delve">
    <div class="delve-hud">
      <span class="chip neon">{{ seconds }}s</span>
      <span class="chip" :style="{ borderColor: biome.accent, color: biome.accent }">{{ biome.name }}</span>
      <span class="chip">d{{ depth }} · {{ zone }}</span>
      <span class="chip">ore {{ ores }} · cry {{ crystals }}</span>
      <span class="chip" v-if="combo > 1">{{ combo }}x chain</span>
      <span class="chip hp">♥ {{ hp }}</span>
    </div>
    <p class="tiny muted delve-line" v-if="contract">
      CONTRACT · {{ contract.title }} — {{ runContract.value }}/{{ runContract.goal }} {{ contract.unit }}
      <span v-if="runContract.done"> ✓ met, extract to bank it</span>
    </p>
    <canvas
      ref="canvas"
      class="delve-canvas"
      style="touch-action: none"
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
      <p class="tiny muted">Drag anywhere on the cave to steer and dig. WASD / pads also work. Chain breaks under {{ comboWindow }}s to build a combo.</p>
      <button type="button" class="btn ghost wide" @click="end">EXTRACT / CASH OUT</button>
    </div>
  </div>
</template>

<script>
import {
  dailyCave,
  dailyBiome,
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
  rankFromXp,
  comboStep,
  COMBO_WINDOW
} from '../../engine/delve.js'
import { todaysContract, contractProgress } from '../../engine/contracts.js'
import { dateKey } from '../../engine/dates.js'

const ORE_GLOW = '#ffd23f'
const CRYSTAL_GLOW = '#3dffd2'
const MAX_PARTICLES = 220

export default {
  name: 'RiftDelve',
  emits: ['done'],
  props: {
    exploreXp: { type: Number, default: 0 }
  },
  data() {
    const today = dateKey()
    const biome = dailyBiome(today)
    const contract = todaysContract(today)
    return {
      biome,
      contract: contract.game === 'riftDelve' ? contract : null,
      px: SPAWN.x + 0.5,
      py: SPAWN.y + 0.5,
      mining: false,
      ores: 0,
      crystals: 0,
      revealedCount: 0,
      combo: 0,
      comboMax: 0,
      hp: 3,
      seconds: 80,
      comboWindow: COMBO_WINDOW,
      ended: false
    }
  },
  created() {
    const today = dateKey()
    const cave = dailyCave(today)
    // Kept off the reactive graph: touched every frame, never read by the template.
    this.cave = cave
    this.hpMap = cave.tiles.map((t) => TILE_HP[t])
    this.revealed = Object.create(null)
    this.mites = cave.mites.map((m) => ({ ...m, fx: m.x + 0.5, fy: m.y + 0.5 }))
    this.particles = []
    this.texts = []
    this.keys = { x: 0, y: 0 }
    this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 }
    this.face = { x: 0, y: -1 }
    this.clock = 0
    this.lastBreakAt = -99
    this.mineTick = 0
    this.hitFlash = 0
    this.shake = 0
    this.raf = 0
    this.last = 0
    this.timers = []
    this.actx = null
    this.audioBlocked = false
    this.dpr = 1
  },
  computed: {
    rank() { return rankFromXp(this.exploreXp) },
    depth() { return depthFrom(Math.floor(this.px), Math.floor(this.py)) },
    zone() { return zoneDifficulty(this.depth) },
    /** Live view of this run against today's contract, so the goal is visible mid-run. */
    runContract() {
      const contract = this.contract
      if (!contract) return { value: 0, goal: 1, done: false }
      const counts = {
        ores: this.ores,
        crystals: this.crystals,
        runOres: this.ores,
        runCrystals: this.crystals,
        depth: this.depth,
        combo: this.comboMax,
        delveScore: this.liveScore
      }
      return contractProgress({ contractDate: contract.date, contractCounts: counts }, contract)
    },
    liveScore() {
      return scoreRun({
        revealed: this.revealedCount,
        ores: this.ores,
        crystals: this.crystals,
        depth: this.depth,
        hp: this.hp,
        comboMax: this.comboMax
      })
    }
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
    this.closeAudio()
  },
  methods: {
    /* ---------- audio: synthesised blips, no asset files ---------- */
    audio() {
      if (this.audioBlocked) return null
      if (this.actx) return this.actx
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (!Ctx) {
          this.audioBlocked = true
          return null
        }
        this.actx = new Ctx()
      } catch {
        this.audioBlocked = true
        return null
      }
      return this.actx
    },
    blip(from, to, dur, type = 'square', peak = 0.06) {
      const ctx = this.audio()
      if (!ctx) return
      try {
        if (ctx.state === 'suspended' && ctx.resume) ctx.resume()
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.setValueAtTime(from, now)
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + dur)
        gain.gain.setValueAtTime(0.0001, now)
        gain.gain.exponentialRampToValueAtTime(peak, now + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(now)
        osc.stop(now + dur + 0.02)
      } catch {
        this.audioBlocked = true
      }
    },
    closeAudio() {
      try {
        if (this.actx && this.actx.close) this.actx.close()
      } catch {
        /* already gone */
      }
      this.actx = null
    },
    sfxMine() { this.blip(180 + this.combo * 22, 90, 0.06, 'square', 0.035) },
    sfxOre() { this.blip(520, 900, 0.14, 'triangle', 0.07) },
    sfxCrystal() { this.blip(760, 1500, 0.22, 'sine', 0.08) },
    sfxHurt() { this.blip(220, 60, 0.28, 'sawtooth', 0.09) },
    sfxExtract() { this.blip(340, 1200, 0.4, 'triangle', 0.08) },

    /* ---------- particles and floating text ---------- */
    burst(wx, wy, color, count = 8, power = 2.6) {
      for (let i = 0; i < count; i++) {
        if (this.particles.length >= MAX_PARTICLES) break
        const a = Math.random() * Math.PI * 2
        const s = power * (0.35 + Math.random() * 0.9)
        const life = 0.28 + Math.random() * 0.42
        this.particles.push({
          x: wx,
          y: wy,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life,
          max: life,
          color,
          size: 0.06 + Math.random() * 0.09
        })
      }
    },
    float(wx, wy, text, color) {
      this.texts.push({ x: wx, y: wy, text, color, life: 0.95, max: 0.95 })
      if (this.texts.length > 14) this.texts.shift()
    },
    stepEffects(dt) {
      const alive = []
      for (const p of this.particles) {
        p.life -= dt
        if (p.life <= 0) continue
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.vy += 1.8 * dt
        p.vx *= 0.94
        alive.push(p)
      }
      this.particles = alive
      const texts = []
      for (const t of this.texts) {
        t.life -= dt
        if (t.life <= 0) continue
        t.y -= 1.15 * dt
        texts.push(t)
      }
      this.texts = texts
    },

    /* ---------- input ---------- */
    hold(axis, value) {
      this.keys[axis] = value
      if (value) this.face = { x: axis === 'x' ? value : 0, y: axis === 'y' ? value : 0 }
    },
    onKey(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft') this.hold('x', -1)
      if (k === 'd' || k === 'arrowright') this.hold('x', 1)
      if (k === 'w' || k === 'arrowup') this.hold('y', -1)
      if (k === 's' || k === 'arrowdown') this.hold('y', 1)
      if (k === ' ' || k === 'e') this.mining = true
    },
    onKeyUp(e) {
      const k = e.key.toLowerCase()
      if (k === 'a' || k === 'arrowleft' || k === 'd' || k === 'arrowright') this.keys.x = 0
      if (k === 'w' || k === 'arrowup' || k === 's' || k === 'arrowdown') this.keys.y = 0
      if (k === ' ' || k === 'e') this.mining = false
    },
    /** Virtual stick: press anywhere on the cave, drag to steer, holding also digs. */
    onPointer(e) {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (e.type === 'pointerdown') {
        try {
          canvas.setPointerCapture(e.pointerId)
        } catch {
          /* capture is a nicety */
        }
        this.stick = { active: true, ox: x, oy: y, dx: 0, dy: 0, mag: 0 }
        this.mining = true
        this.audio()
        return
      }
      if (!this.stick.active) return
      const radius = Math.max(28, Math.min(rect.width, rect.height) * 0.16)
      let dx = x - this.stick.ox
      let dy = y - this.stick.oy
      const len = Math.hypot(dx, dy)
      const dead = radius * 0.22
      if (len < dead) {
        this.stick.dx = 0
        this.stick.dy = 0
        this.stick.mag = 0
        this.keys.x = 0
        this.keys.y = 0
        return
      }
      const clamped = Math.min(1, len / radius)
      dx = (dx / len) * clamped
      dy = (dy / len) * clamped
      this.stick.dx = dx
      this.stick.dy = dy
      this.stick.mag = clamped
      this.keys.x = dx
      this.keys.y = dy
      if (Math.abs(dx) >= Math.abs(dy)) this.face = { x: dx > 0 ? 1 : -1, y: 0 }
      else this.face = { x: 0, y: dy > 0 ? 1 : -1 }
    },
    endPointer(e) {
      if (!this.stick.active) return
      const canvas = this.$refs.canvas
      try {
        if (canvas && e && e.pointerId != null && canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId)
        }
      } catch {
        /* nothing to release */
      }
      this.stick = { active: false, ox: 0, oy: 0, dx: 0, dy: 0, mag: 0 }
      this.keys.x = 0
      this.keys.y = 0
      this.mining = false
    },

    /* ---------- world ---------- */
    resize() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      this.dpr = dpr
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
      let gained = 0
      for (let y = cy - 8; y <= cy + 8; y++) {
        for (let x = cx - 8; x <= cx + 8; x++) {
          const d = Math.hypot(x + 0.5 - this.px, y + 0.5 - this.py)
          if (d > r + 0.4) continue
          const key = `${x},${y}`
          if (this.revealed[key]) continue
          this.revealed[key] = true
          gained += 1
        }
      }
      if (gained) this.revealedCount += gained
    },
    tryMove(dt) {
      const speed = 3.4 + this.rank.id * 0.35
      const nx = this.px + this.keys.x * speed * dt
      const ny = this.py + this.keys.y * speed * dt
      if (!this.blocked(nx, this.py)) this.px = nx
      if (!this.blocked(this.px, ny)) this.py = ny
    },
    facing() {
      let fx = this.face.x
      let fy = this.face.y
      if (!fx && !fy) fy = -1
      return { x: Math.floor(this.px) + fx, y: Math.floor(this.py) + fy }
    },
    tryMine(dt) {
      if (!this.mining || this.ended) return
      this.mineTick += dt
      if (this.mineTick < 0.18) return
      this.mineTick = 0
      const { x, y } = this.facing()
      const t = this.tile(x, y)
      if (!canMineTile(t, this.rank.minePower)) return
      const i = tileIndex(x, y)
      this.hpMap[i] -= 1
      const cx = x + 0.5
      const cy = y + 0.5
      const dust = t === TILE.ORE ? ORE_GLOW : t === TILE.CRYSTAL ? CRYSTAL_GLOW : this.biome.accent
      this.burst(cx, cy, dust, 5, 1.7)
      this.sfxMine()
      if (this.hpMap[i] > 0) return
      this.setTile(x, y, TILE.AIR)
      this.registerBreak()
      if (t === TILE.ORE) {
        this.ores += 1
        this.burst(cx, cy, ORE_GLOW, 16, 3.2)
        this.float(cx, cy, '+ore', ORE_GLOW)
        this.sfxOre()
      } else if (t === TILE.CRYSTAL) {
        this.crystals += 1
        this.burst(cx, cy, CRYSTAL_GLOW, 22, 3.8)
        this.float(cx, cy, '+crystal', CRYSTAL_GLOW)
        this.sfxCrystal()
      }
      if (this.combo >= 5 && this.combo === this.comboMax) {
        this.float(cx, cy - 0.5, `${this.combo}x`, '#c8ff3d')
      }
    },
    registerBreak() {
      this.combo = comboStep(this.combo, this.clock - this.lastBreakAt)
      this.lastBreakAt = this.clock
      this.comboMax = Math.max(this.comboMax, this.combo)
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
      this.shake = 1
      this.combo = 0
      this.burst(this.px, this.py, '#ff2bd6', 18, 3.4)
      this.float(this.px, this.py, '-1 ♥', '#ff2bd6')
      this.sfxHurt()
      if (this.hp <= 0) this.end()
    },
    end() {
      if (this.ended) return
      this.ended = true
      this.sfxExtract()
      cancelAnimationFrame(this.raf)
      this.timers.forEach(clearInterval)
      const revealed = this.revealedCount
      const depth = this.depth
      const payload = {
        score: scoreRun({
          revealed,
          ores: this.ores,
          crystals: this.crystals,
          depth,
          hp: this.hp,
          comboMax: this.comboMax
        }),
        exploreXp: exploreXpFrom({ revealed, ores: this.ores, crystals: this.crystals, depth }),
        depth,
        ores: this.ores,
        crystals: this.crystals,
        revealed,
        comboMax: this.comboMax,
        biome: this.biome.id
      }
      this.$emit('done', payload)
    },
    loop(now) {
      const dt = Math.min(0.05, (now - this.last) / 1000)
      this.last = now
      this.clock += dt
      this.hitFlash = Math.max(0, this.hitFlash - dt)
      this.shake = Math.max(0, this.shake - dt * 3.2)
      if (this.combo && this.clock - this.lastBreakAt > COMBO_WINDOW) this.combo = 0
      this.tryMove(dt)
      this.tryMine(dt)
      this.moveMites(dt)
      this.stepEffects(dt)
      this.revealAround()
      this.draw()
      if (!this.ended) this.raf = requestAnimationFrame(this.loop)
    },
    draw() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const w = canvas.width
      const h = canvas.height
      const tile = Math.floor(Math.min(w, h) / 11)
      const pal = this.biome.palette
      const colors = {
        [TILE.AIR]: pal.air,
        [TILE.SOIL]: pal.soil,
        [TILE.STONE]: pal.stone,
        [TILE.HARD]: pal.hard,
        [TILE.ORE]: ORE_GLOW,
        [TILE.CRYSTAL]: CRYSTAL_GLOW,
        [TILE.BEDROCK]: '#09070f'
      }
      ctx.fillStyle = '#07060c'
      ctx.fillRect(0, 0, w, h)
      const jitter = this.shake * tile * 0.22
      const sx0 = this.shake ? (Math.random() - 0.5) * jitter : 0
      const sy0 = this.shake ? (Math.random() - 0.5) * jitter : 0
      const camX = this.px * tile - w / 2 + sx0
      const camY = this.py * tile - h / 2 + sy0
      const light = this.rank.light * tile

      for (let y = 0; y < MAP_H; y++) {
        for (let x = 0; x < MAP_W; x++) {
          if (!this.revealed[`${x},${y}`]) continue
          const sx = Math.floor(x * tile - camX)
          const sy = Math.floor(y * tile - camY)
          if (sx < -tile || sy < -tile || sx > w || sy > h) continue
          const t = this.tile(x, y)
          ctx.fillStyle = colors[t]
          ctx.fillRect(sx, sy, tile - 1, tile - 1)
          if (t === TILE.ORE || t === TILE.CRYSTAL) {
            ctx.fillStyle = t === TILE.ORE ? '#fff1a8' : '#e9fff9'
            ctx.fillRect(sx + tile * 0.3, sy + tile * 0.3, tile * 0.35, tile * 0.35)
          }
        }
      }

      const target = this.facing()
      if (this.revealed[`${target.x},${target.y}`] && this.tile(target.x, target.y) !== TILE.AIR) {
        ctx.strokeStyle = this.mining ? '#c8ff3d' : 'rgba(200, 255, 61, 0.35)'
        ctx.lineWidth = Math.max(1, tile * 0.06)
        ctx.strokeRect(
          Math.floor(target.x * tile - camX) + 1,
          Math.floor(target.y * tile - camY) + 1,
          tile - 3,
          tile - 3
        )
      }

      const shade = ctx.createRadialGradient(w / 2, h / 2, tile * 0.6, w / 2, h / 2, light)
      shade.addColorStop(0, 'rgba(255, 230, 120, 0.08)')
      shade.addColorStop(0.55, 'rgba(8, 6, 16, 0.15)')
      shade.addColorStop(1, 'rgba(4, 3, 10, 0.78)')
      ctx.fillStyle = shade
      ctx.fillRect(0, 0, w, h)

      for (const p of this.particles) {
        const a = Math.max(0, p.life / p.max)
        ctx.globalAlpha = a
        ctx.fillStyle = p.color
        const s = Math.max(1, p.size * tile)
        ctx.fillRect(p.x * tile - camX - s / 2, p.y * tile - camY - s / 2, s, s)
      }
      ctx.globalAlpha = 1

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
      ctx.shadowColor = this.combo >= 5 ? this.biome.accent : '#c8ff3d'
      ctx.shadowBlur = this.combo >= 5 ? 30 : 18
      ctx.beginPath()
      ctx.arc(w / 2 - sx0, h / 2 - sy0, tile * 0.34, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.font = `600 ${Math.max(10, Math.floor(tile * 0.42))}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      for (const t of this.texts) {
        ctx.globalAlpha = Math.max(0, t.life / t.max)
        ctx.fillStyle = t.color
        ctx.fillText(t.text, t.x * tile - camX, t.y * tile - camY)
      }
      ctx.globalAlpha = 1

      if (this.stick.active) {
        const dpr = this.dpr || 1
        const ox = this.stick.ox * dpr
        const oy = this.stick.oy * dpr
        const radius = Math.max(28, Math.min(w, h) * 0.16)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ox, oy, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = 'rgba(200, 255, 61, 0.35)'
        ctx.beginPath()
        ctx.arc(ox + this.stick.dx * radius, oy + this.stick.dy * radius, radius * 0.32, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}
</script>
