<template>
  <section class="stack" style="padding-top: 18px;">
    <p class="tiny muted center">Meet your companion</p>
    <LumaCreature :stage="0" skin="ember" mood="happy" />
    <div class="center stack">
      <h1>Luma. Drop in.</h1>
      <p class="muted">Daily sparks plus a cave raid you actually want to replay. Explore deeper, rank up, unlock meaner difficulty. Safe, no loot boxes, no pay-to-hurt-people.</p>
    </div>

    <div class="card stack" v-if="step === 0">
      <label class="tiny muted">What should Luma call you?</label>
      <input class="field" v-model="name" maxlength="24" placeholder="Your first name" />
      <button class="btn primary wide" :disabled="!name.trim()" @click="step = 1">LET’S GLOW</button>
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
      <button class="btn primary wide" @click="finish">START SPARK</button>
      <button class="btn ghost wide" @click="finish">SKIP — JUST PLAY</button>
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
        { id: 'create', label: '✦ Make stuff' },
        { id: 'kindness', label: '♡ Keep it decent' },
        { id: 'curious', label: '? Riddles & weird picks' },
        { id: 'body', label: '✧ Unclench for 60s' },
        { id: 'play', label: '▶ Games / Rift Delve' }
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
