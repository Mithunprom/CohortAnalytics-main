<template>
  <div class="luma-wrap">
    <div class="halo"></div>
    <svg class="luma" :class="mood" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <radialGradient :id="'body-' + skin" cx="50%" cy="50%" r="50%">
          <stop offset="0%" :stop-color="palette.core" />
          <stop offset="55%" :stop-color="palette.mid" />
          <stop offset="100%" :stop-color="palette.edge" />
        </radialGradient>
      </defs>
      <ellipse class="wing left" cx="62" cy="78" rx="38" ry="16" :fill="palette.wing" opacity="0.55" />
      <ellipse class="wing right" cx="138" cy="78" rx="38" ry="16" :fill="palette.wing" opacity="0.55" />
      <circle cx="100" cy="108" :r="36 + stage * 3" :fill="'url(#body-' + skin + ')'" />
      <circle cx="100" cy="104" r="12" fill="#fff6d6" opacity="0.9" />
      <circle cx="90" cy="96" r="4" fill="#1a1030" />
      <circle cx="110" cy="96" r="4" fill="#1a1030" />
      <path v-if="mood === 'happy' || mood === 'celebrate'" d="M90 114 Q100 124 110 114" stroke="#1a1030" stroke-width="3" fill="none" stroke-linecap="round" />
      <path v-else d="M92 116 Q100 120 108 116" stroke="#1a1030" stroke-width="3" fill="none" stroke-linecap="round" />
      <g v-if="stage >= 2">
        <circle cx="70" cy="50" r="3" fill="#ffe08a" />
        <circle cx="130" cy="44" r="2.5" fill="#c4b5fd" />
        <circle cx="150" cy="90" r="2" fill="#5eead4" />
      </g>
    </svg>
  </div>
</template>

<script>
const SKINS = {
  ember: { core: '#fff6d6', mid: '#ffb36b', edge: '#7c3aed', wing: '#c4b5fd' },
  mint: { core: '#ecfdf5', mid: '#5eead4', edge: '#0f766e', wing: '#a7f3d0' },
  orchid: { core: '#fae8ff', mid: '#e879f9', edge: '#6d28d9', wing: '#f5d0fe' },
  gold: { core: '#fffbeb', mid: '#fbbf24', edge: '#b45309', wing: '#fde68a' }
}

export default {
  name: 'LumaCreature',
  props: {
    stage: { type: Number, default: 0 },
    skin: { type: String, default: 'ember' },
    mood: { type: String, default: 'idle' }
  },
  computed: {
    palette() {
      return SKINS[this.skin] || SKINS.ember
    }
  }
}
</script>

<style scoped>
.wing.left { transform-origin: 90px 78px; animation: flap 2.4s ease-in-out infinite; }
.wing.right { transform-origin: 110px 78px; animation: flap 2.4s ease-in-out infinite reverse; }
@keyframes flap {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(10deg); }
}
</style>
