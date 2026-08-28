<template>
  <section class="stack">
    <div class="row" style="justify-content: space-between;">
      <div>
        <p class="tiny neon-text">{{ greeting }}</p>
        <h1>{{ name }}</h1>
      </div>
      <span class="chip neon">{{ view.delveRank?.name || 'Scout' }}</span>
    </div>

    <button type="button" class="plain-luma" @click="$emit('open-nest')" aria-label="Open Luma's nest">
      <LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" :mood="lumaMood" />
    </button>
    <p class="tiny muted center">Tap Luma to drip the nest</p>

    <button type="button" class="card featured-drop stack" @click="$emit('open-play')">
      <p class="tiny neon-text">FEATURED RAID</p>
      <h2>Rift Delve</h2>
      <p class="muted">Explore a living cave. Mine. Rank up. Difficulty gets meaner the deeper you go.</p>
      <span class="btn primary wide">ENTER THE RIFT</span>
    </button>

    <div class="stats">
      <div class="card stat"><b>{{ view.progress.streak }}</b><span class="tiny muted">streak</span></div>
      <div class="card stat"><b>{{ view.progress.exploreXp || 0 }}</b><span class="tiny muted">explore</span></div>
      <div class="card stat"><b>{{ view.delveRank?.difficulty || 'Chill' }}</b><span class="tiny muted">diff</span></div>
    </div>

    <div class="card stack">
      <p class="tiny muted">How’s the weather inside?</p>
      <div class="row" style="justify-content: space-between;">
        <button v-for="mood in moods" :key="mood.id" class="choice" style="width:auto;padding:10px 12px" :class="{ picked: view.progress.moodToday === mood.id && view.progress.lastMoodDate === view.today }" @click="store.setMood(mood.id)">{{ mood.face }}</button>
      </div>
    </div>

    <div class="card stack">
      <div class="row" style="justify-content: space-between;">
        <span class="chip">{{ category.label }}</span>
        <span class="tiny muted">{{ prettyDate }}</span>
      </div>
      <h2>{{ view.quest.title }}</h2>
      <p class="muted">{{ view.quest.prompt }}</p>
      <button class="btn primary wide" @click="$emit('open-spark')">
        {{ alreadyDone ? 'Replay spark' : 'START SPARK' }}
      </button>
    </div>
  </section>
</template>

<script>
import LumaCreature from './LumaCreature.vue'
import { CATEGORIES } from '../engine/quests.js'
import { formatPrettyDate } from '../engine/dates.js'

export default {
  name: 'HomeView',
  components: { LumaCreature },
  inject: ['game', 'store'],
  emits: ['open-spark', 'open-nest', 'open-play'],
  data() {
    return {
      moods: [
        { id: 'glow', face: '✦' },
        { id: 'calm', face: '☾' },
        { id: 'meh', face: '☁' },
        { id: 'storm', face: '⛈' },
        { id: 'spark', face: '★' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    name() { return this.view.profile.name || 'friend' },
    greeting() {
      const h = new Date().getHours()
      if (h < 12) return 'MORNING DROP'
      if (h < 18) return 'AFTERNOON QUEUE'
      return 'NIGHT RAID'
    },
    category() { return CATEGORIES[this.view.quest?.category] || CATEGORIES.play },
    prettyDate() { return formatPrettyDate(this.view.today) },
    alreadyDone() { return Boolean(this.view.progress.constellation[this.view.today]) },
    lumaMood() {
      if (this.alreadyDone) return 'happy'
      if (this.view.progress.streak >= 3) return 'happy'
      return 'idle'
    }
  }
}
</script>
