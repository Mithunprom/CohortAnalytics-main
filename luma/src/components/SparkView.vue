<template>
  <section class="stack">
    <div class="row between">
      <span class="chip neon">SIDE MISSION · {{ category.label }}</span>
      <button class="btn ghost sm" :disabled="view.gated.reroll && !view.plus" @click="reroll">
        RESHUFFLE
      </button>
    </div>
    <h1>{{ quest.title }}</h1>
    <p class="muted">{{ quest.prompt }}</p>

    <div class="card stack" v-if="alreadyDone && !playingExtra">
      <p class="tiny neon-text">CLEARED TODAY</p>
      <p>{{ alreadyDone.answer || 'Done.' }}</p>
      <button v-if="view.plus" class="btn ghost wide" @click="playingExtra = true">RUN ANOTHER</button>
      <button v-else class="btn primary wide" @click="$emit('need-plus', 'Extra sparks are a Plus thing. One a day is free, forever.')">UNLOCK EXTRA SPARKS</button>
    </div>

    <template v-else>
      <div v-if="quest.type === 'write'" class="stack">
        <textarea class="area" v-model="answer" :placeholder="quest.placeholder || 'One line is enough.'"></textarea>
        <button class="btn primary wide giant" :disabled="answer.trim().length < 4" @click="complete(answer)">LOCK IT IN</button>
      </div>

      <div v-else-if="quest.type === 'choice'" class="stack">
        <button v-for="opt in quest.options" :key="opt" class="choice" :class="{ picked: answer === opt }" @click="answer = opt">{{ opt }}</button>
        <button class="btn primary wide giant" :disabled="!answer" @click="complete(answer)">LOCK IT IN</button>
      </div>

      <div v-else-if="quest.type === 'riddle'" class="stack">
        <input class="field" v-model="answer" placeholder="Your guess" @keyup.enter="tryRiddle" />
        <p v-if="hint" class="muted">Hint: {{ hint }}</p>
        <p v-if="riddleError" class="tiny warn">{{ riddleError }}</p>
        <div class="row">
          <button class="btn ghost" style="flex:1" @click="showHint">HINT</button>
          <button class="btn primary" style="flex:2" @click="tryRiddle">GUESS</button>
        </div>
      </div>

      <div v-else-if="quest.type === 'action'" class="stack">
        <p class="muted">No photo, no proof, no guilt. Just do the thing.</p>
        <button class="btn primary wide giant" @click="complete(quest.confirm)">{{ (quest.confirm || 'Did it').toUpperCase() }}</button>
      </div>

      <div v-else-if="quest.type === 'breathe'" class="stack center">
        <div class="breathe"></div>
        <p class="muted">In · hold · out. Three rounds, then you’re out of here.</p>
        <button class="btn primary wide giant" @click="complete('breathed')">DONE</button>
      </div>

      <div v-else-if="quest.type === 'play'" class="stack">
        <StarCatch v-if="quest.game === 'starCatch'" @done="onGame" />
        <GlowMemory v-else-if="quest.game === 'glowMemory'" @done="onGame" />
        <WordSpark v-else-if="quest.game === 'wordSpark'" @done="onGame" />
      </div>
    </template>
  </section>
</template>

<script>
import { CATEGORIES, riddleCorrect } from '../engine/quests.js'
import StarCatch from './games/StarCatch.vue'
import GlowMemory from './games/GlowMemory.vue'
import WordSpark from './games/WordSpark.vue'

export default {
  name: 'SparkView',
  components: { StarCatch, GlowMemory, WordSpark },
  inject: ['game', 'store'],
  emits: ['need-plus', 'celebrated'],
  data() {
    return { answer: '', hintIndex: 0, riddleError: '', playingExtra: false }
  },
  computed: {
    view() { return this.game.view },
    quest() { return this.view.quest || { title: 'Spark', prompt: '', type: 'action', category: 'play', confirm: 'Continue' } },
    category() { return CATEGORIES[this.quest.category] || CATEGORIES.play },
    alreadyDone() { return this.view.progress.constellation[this.view.today] },
    hint() { return (this.quest.hints || [])[this.hintIndex - 1] }
  },
  methods: {
    reroll() {
      const result = this.store.reroll()
      if (!result.ok) this.$emit('need-plus', 'Reshuffling sparks is a Plus thing.')
      else {
        this.answer = ''
        this.hintIndex = 0
        this.riddleError = ''
      }
    },
    showHint() {
      this.hintIndex = Math.min((this.quest.hints || []).length, this.hintIndex + 1)
    },
    tryRiddle() {
      if (riddleCorrect(this.quest, this.answer)) this.complete(this.answer)
      else this.riddleError = 'Not that lantern. Try again — or take a hint.'
    },
    onGame(score) {
      this.complete(`score ${score}`)
    },
    complete(answer) {
      const result = this.store.completeSpark(answer)
      if (!result.ok) {
        this.$emit('need-plus', 'One spark a day is free. Plus keeps them coming.')
        return
      }
      this.playingExtra = false
      this.answer = ''
      this.$emit('celebrated')
    }
  }
}
</script>
