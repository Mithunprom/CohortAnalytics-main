<template>
  <section class="stack">
    <div class="row" style="justify-content: space-between;">
      <div>
        <p class="tiny muted">{{ greeting }}</p>
        <h1>{{ name }}.</h1>
      </div>
      <span class="chip">{{ view.stageName }} · {{ view.progress.xp }} xp</span>
    </div>

    <button type="button" class="plain-luma" @click="$emit('open-nest')" aria-label="Open Luma's nest">
      <LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" :mood="lumaMood" />
    </button>
    <p class="tiny muted center">Tap Luma to decorate the nest</p>

    <div class="stats">
      <div class="card stat"><b>{{ view.progress.streak }}</b><span class="tiny muted">streak</span></div>
      <div class="card stat"><b>{{ view.progress.totalSparks }}</b><span class="tiny muted">sparks</span></div>
      <div class="card stat"><b>{{ Object.keys(view.progress.constellation).length }}</b><span class="tiny muted">stars</span></div>
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
        {{ alreadyDone ? 'See today’s spark' : 'Begin 60-second spark' }}
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
  emits: ['open-spark', 'open-nest'],
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
      if (h < 12) return 'Good morning'
      if (h < 18) return 'Good afternoon'
      return 'Good evening'
    },
    category() { return CATEGORIES[this.view.quest.category] || CATEGORIES.play },
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
