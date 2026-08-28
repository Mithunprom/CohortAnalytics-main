<template>
  <section class="stack">
    <h1>PLUS PASS</h1>
    <p class="muted">Unlimited runs. That’s the whole trick. No ads, no loot boxes, no selling your mood.</p>

    <div class="card stack" v-if="view.plus">
      <p class="tiny muted">You’re glowing</p>
      <h2>{{ planLabel }}</h2>
      <p class="muted">Renews {{ expiry }}. Manage in App Store settings after launch.</p>
      <p>Streak shields in pocket: {{ view.progress.streakShields }}</p>
    </div>

    <div class="card stack">
      <p class="tiny muted">What Plus unlocks</p>
      <p>Unlimited Rift Delve + Neon Rush energy</p>
      <p>Unlimited extra sparks and rerolls</p>
      <p>Aurora habitats and companion skins</p>
      <p>A streak shield every 7 days</p>
    </div>

    <div class="price" v-if="!view.plus">
      <button class="plan best" @click="choose('yearly')">
        <span class="tag">Best value</span>
        <b>Yearly · $29.99</b>
        <p class="muted">7-day free trial · $2.50 / month</p>
      </button>
      <button class="plan" @click="choose('monthly')">
        <b>Monthly · $4.99</b>
        <p class="muted">7-day free trial · cancel anytime</p>
      </button>
    </div>

    <button class="btn ghost wide" @click="restore">Restore purchases</button>
    <p class="tiny muted center">
      Payment will be charged to your Apple ID at confirmation. Subscriptions auto-renew unless canceled at least 24 hours before the end of the period.
      This web build uses a local demo StoreKit so you can try Plus immediately.
    </p>
    <p class="tiny muted center">Privacy · Terms · No tracking of kids · Health is not medical advice</p>
  </section>
</template>

<script>
import { PRODUCTS } from '../engine/rules.js'

export default {
  name: 'PlusView',
  inject: ['game', 'store'],
  emits: ['subscribed'],
  computed: {
    view() { return this.game.view },
    planLabel() {
      return this.view.subscription.plan === 'yearly' ? 'Plus Yearly' : 'Plus Monthly'
    },
    expiry() {
      if (!this.view.subscription.expiresAt) return 'with your trial'
      return new Date(this.view.subscription.expiresAt).toLocaleDateString()
    }
  },
  methods: {
    choose(key) {
      this.store.subscribePlan(key)
      this.store.rememberReceipt()
      this.$emit('subscribed', PRODUCTS[key].label)
    },
    restore() {
      const result = this.store.restorePurchases()
      if (result.ok) this.$emit('subscribed', 'Restored')
      else alert('No previous Plus receipt on this device yet.')
    }
  }
}
</script>
