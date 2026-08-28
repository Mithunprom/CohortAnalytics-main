<template>
  <div class="card stack">
    <p class="tiny muted">Unscramble</p>
    <h2 class="center" style="letter-spacing: 0.28em;">{{ scrambled.toUpperCase() }}</h2>
    <input class="field" v-model="guess" placeholder="the word" @keyup.enter="check" />
    <p v-if="error" class="muted" style="color: var(--danger)">{{ error }}</p>
    <button class="btn primary wide" @click="check">Light it</button>
  </div>
</template>

<script>
import { todaysWord, scrambleWord, normalizeAnswer } from '../../engine/quests.js'
import { dateKey } from '../../engine/dates.js'

export default {
  name: 'WordSpark',
  emits: ['done'],
  data() {
    const today = dateKey()
    const word = todaysWord(today)
    return {
      word,
      scrambled: scrambleWord(word, today),
      guess: '',
      error: ''
    }
  },
  methods: {
    check() {
      if (normalizeAnswer(this.guess) === normalizeAnswer(this.word)) {
        this.$emit('done', this.word.length * 5)
      } else {
        this.error = 'Those letters want a different home.'
      }
    }
  }
}
</script>
