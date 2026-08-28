<template>
  <section class="stack onboard">
    <div class="steps">
      <i class="on"></i>
      <i :class="{ on: step === 1 }"></i>
    </div>

    <div class="luma-mini hero"><LumaCreature :stage="0" skin="ember" mood="happy" /></div>

    <div class="center stack tight">
      <h1>Luma. Drop in.</h1>
      <p class="muted">A cave raid that gets meaner the higher you rank, plus one 60-second spark a day. No ads. No loot boxes. Nothing sold that makes you stronger.</p>
    </div>

    <div class="card stack" v-if="step === 0">
      <label class="tiny muted" for="luma-name">WHAT DO WE CALL YOU?</label>
      <input id="luma-name" class="field" v-model="name" maxlength="24" placeholder="First name" @keyup.enter="next" />
      <button class="btn primary wide giant" :disabled="!name.trim()" @click="next">NEXT</button>
      <button class="btn ghost wide sm" @click="finish('play')">SKIP — JUST PLAY</button>
    </div>

    <div class="card stack" v-else>
      <p class="tiny muted">PICK ONE. YOU’RE IN.</p>
      <button
        v-for="item in intents"
        :key="item.id"
        class="intent"
        :class="{ picked: selected === item.id }"
        @click="pick(item)"
      >{{ item.label }}</button>
      <p class="tiny muted center">Rift Delve is waiting either way.</p>
      <button class="btn ghost wide sm" @click="finish('play')">SKIP — JUST PLAY</button>
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
      selected: null,
      intents: [
        { id: 'play', label: '▶ Raids and high scores', dest: 'play' },
        { id: 'create', label: '✦ Make weird stuff' },
        { id: 'curious', label: '? Riddles and strange picks' },
        { id: 'kindness', label: '♡ Keep it decent out there' },
        { id: 'body', label: '✧ Unclench for 60 seconds' }
      ]
    }
  },
  methods: {
    next() {
      if (this.name.trim()) this.step = 1
    },
    pick(item) {
      this.selected = item.id
      this.finish(item.dest || 'spark')
    },
    finish(dest) {
      this.store.completeOnboarding({
        name: this.name.trim() || 'friend',
        intents: this.selected ? [this.selected] : []
      })
      this.$emit('started', dest || 'spark')
    }
  }
}
</script>
