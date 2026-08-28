<template>
  <div class="stack">
    <p class="center muted">{{ status }}</p>
    <div class="game-stage">
      <div class="pads">
        <button
          v-for="(color, i) in colors"
          :key="color"
          class="pad"
          :class="{ on: lit === i }"
          :style="{ background: color }"
          :disabled="phase !== 'input'"
          @click="press(i)"
        ></button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlowMemory',
  emits: ['done'],
  data() {
    return {
      colors: ['#ffb36b', '#5eead4', '#c4b5fd', '#f9a8d4'],
      sequence: [],
      input: [],
      lit: -1,
      phase: 'watch',
      round: 1,
      status: 'Watch Luma…'
    }
  },
  mounted() {
    this.nextRound()
  },
  methods: {
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    },
    async nextRound() {
      this.phase = 'watch'
      this.input = []
      this.sequence.push(Math.floor(Math.random() * 4))
      this.status = `Round ${this.round} — watch`
      await this.sleep(400)
      for (const step of this.sequence) {
        this.lit = step
        await this.sleep(420)
        this.lit = -1
        await this.sleep(180)
      }
      this.phase = 'input'
      this.status = 'Your turn'
    },
    async press(i) {
      this.input.push(i)
      this.lit = i
      await this.sleep(160)
      this.lit = -1
      const idx = this.input.length - 1
      if (this.input[idx] !== this.sequence[idx]) {
        this.status = 'Almost — Luma still claps'
        this.$emit('done', this.round - 1)
        return
      }
      if (this.input.length === this.sequence.length) {
        if (this.round >= 3) {
          this.status = 'Pattern keeper!'
          this.$emit('done', this.round * 10)
          return
        }
        this.round += 1
        this.nextRound()
      }
    }
  }
}
</script>
