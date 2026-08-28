<template>
  <section class="stack">
    <div class="row" style="justify-content: space-between;">
      <button class="btn ghost" style="padding:8px 12px" @click="shift(-1)">←</button>
      <h2>{{ label }}</h2>
      <button class="btn ghost" style="padding:8px 12px" @click="shift(1)">→</button>
    </div>
    <p class="muted">Each completed spark becomes a star. Tap one to remember the day.</p>
    <div class="card stack">
      <div class="grid-month">
        <span v-for="d in ['S','M','T','W','T','F','S']" :key="d" class="dow">{{ d }}</span>
        <button
          v-for="(cell, i) in cells"
          :key="i"
          class="day"
          :class="{ lit: cell && view.progress.constellation[cell], today: cell === view.today }"
          :disabled="!cell"
          @click="select(cell)"
        >{{ cell ? Number(cell.slice(-2)) : '' }}</button>
      </div>
    </div>
    <div class="card stack" v-if="selectedEntry">
      <p class="tiny muted">{{ selected }}</p>
      <h3>{{ selectedEntry.title }}</h3>
      <p class="muted">{{ selectedEntry.answer }}</p>
    </div>
    <div class="card stack">
      <p class="tiny muted">Badges</p>
      <div class="badge-row">
        <span class="badge" v-for="id in view.progress.badges" :key="id">{{ id.replace(/-/g, ' ') }}</span>
        <span class="muted" v-if="!view.progress.badges.length">Complete a spark to light the first badge.</span>
      </div>
    </div>
  </section>
</template>

<script>
import { monthGrid } from '../engine/dates.js'

export default {
  name: 'SkyView',
  inject: ['game'],
  data() {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth(), selected: null }
  },
  computed: {
    view() { return this.game.view },
    cells() { return monthGrid(this.year, this.month) },
    label() {
      return new Date(this.year, this.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    },
    selectedEntry() {
      return this.selected ? this.view.progress.constellation[this.selected] : null
    }
  },
  methods: {
    shift(delta) {
      const d = new Date(this.year, this.month + delta, 1)
      this.year = d.getFullYear()
      this.month = d.getMonth()
    },
    select(cell) {
      if (cell && this.view.progress.constellation[cell]) this.selected = cell
    }
  }
}
</script>
