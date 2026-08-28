<template>
  <section class="stack" style="padding-top: 18px;">
    <p class="tiny muted center">Meet your companion</p>
    <LumaCreature :stage="0" skin="ember" mood="happy" />
    <div class="center stack">
      <h1>This is Luma.</h1>
      <p class="muted">A pocket firefly who brings one 60-second spark a day — stories, kindness, riddles, breath, and cozy games.</p>
    </div>

    <div class="card stack" v-if="step === 0">
      <label class="tiny muted">What should Luma call you?</label>
      <input class="field" v-model="name" maxlength="24" placeholder="Your first name" />
      <button class="btn primary wide" :disabled="!name.trim()" @click="step = 1">Let’s glow</button>
    </div>

    <div class="card stack" v-else>
      <p class="tiny muted">Pick what you want more of</p>
      <div class="stack">
        <button
          v-for="item in intents"
          :key="item.id"
          class="intent"
          :class="{ picked: selected.includes(item.id) }"
          @click="toggle(item.id)"
        >{{ item.label }}</button>
      </div>
      <button class="btn primary wide" @click="finish">Start my first spark</button>
      <button class="btn ghost wide" @click="finish">Surprise me</button>
    </div>
  </section>
</template>

<script>
import LumaCreature from './LumaCreature.vue'

export default {
  name: 'Onboarding',
  components: { LumaCreature },
  inject: ['store'],
  emits: ['started'],
  data() {
    return {
      step: 0,
      name: '',
      selected: [],
      intents: [
        { id: 'create', label: '✦ Make tiny things' },
        { id: 'kindness', label: '♡ Feel a little kinder' },
        { id: 'curious', label: '? Play with riddles' },
        { id: 'body', label: '✧ Unclench for 60 seconds' },
        { id: 'play', label: '★ Cozy mini-games' }
      ]
    }
  },
  methods: {
    toggle(id) {
      this.selected = this.selected.includes(id)
        ? this.selected.filter((x) => x !== id)
        : [...this.selected, id]
    },
    finish() {
      this.store.completeOnboarding({
        name: this.name.trim() || 'friend',
        intents: this.selected
      })
      this.$emit('started')
    }
  }
}
</script>
