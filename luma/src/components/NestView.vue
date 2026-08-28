<template>
  <section class="stack">
    <h1>Nest</h1>
    <p class="muted">Luma’s home. Free night sky forever. Plus unlocks warmer worlds.</p>
    <LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" mood="idle" />
    <div class="card stack">
      <p class="tiny muted">Habitat</p>
      <button
        v-for="h in habitats"
        :key="h.id"
        class="choice"
        :class="{ picked: view.progress.nest.habitat === h.id }"
        @click="setHabitat(h)"
      >{{ h.name }} {{ h.plus ? '· Plus' : '' }}</button>
    </div>
    <div class="card stack">
      <p class="tiny muted">Glow</p>
      <button
        v-for="s in skins"
        :key="s.id"
        class="choice"
        :class="{ picked: view.progress.nest.skin === s.id }"
        @click="setSkin(s)"
      >{{ s.name }} {{ s.plus ? '· Plus' : '' }}</button>
    </div>
  </section>
</template>

<script>
import LumaCreature from './LumaCreature.vue'
import { HABITATS, SKINS } from '../engine/rules.js'

export default {
  name: 'NestView',
  components: { LumaCreature },
  inject: ['game', 'store'],
  emits: ['need-plus'],
  computed: {
    view() { return this.game.view },
    habitats: () => HABITATS,
    skins: () => SKINS
  },
  methods: {
    setHabitat(h) {
      const result = this.store.setNest({ habitat: h.id })
      if (!result.ok) this.$emit('need-plus', `${h.name} is a Plus habitat.`)
    },
    setSkin(s) {
      const result = this.store.setNest({ skin: s.id })
      if (!result.ok) this.$emit('need-plus', `${s.name} is a Plus glow.`)
    }
  }
}
</script>
