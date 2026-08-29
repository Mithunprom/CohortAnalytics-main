<template>
  <section class="stack">
    <p class="tiny neon-text">PLUS PASS</p>
    <h1>Never run dry.</h1>
    <p class="muted">Unlimited runs. That’s the whole pitch. No ads, no loot boxes, nothing that makes you stronger than the person next to you.</p>

    <div class="card stack" v-if="view.plus">
      <p class="tiny neon-text">ACTIVE</p>
      <h2>{{ planLabel }}</h2>
      <p class="muted">Renews {{ expiry }}. Manage it in App Store settings.</p>
      <p>Streak shields in pocket: {{ view.progress.streakShields }}</p>
      <a class="btn ghost wide sm" :href="manageUrl" target="_blank" rel="noopener">MANAGE SUBSCRIPTION</a>
    </div>

    <div class="card stack tight">
      <p class="tiny muted">WHAT YOU GET</p>
      <p>◆ Unlimited Rift Delve and Neon Rush energy</p>
      <p>◆ Extra sparks and reshuffles, all day</p>
      <p>◆ Aurora habitats and companion skins</p>
      <p>◆ A streak shield every 7 days</p>
      <p class="small muted">What you don’t get: mine power, rank, or any advantage over anyone. Those come from the Rift.</p>
    </div>

    <div class="price" v-if="!view.plus">
      <button class="plan best" :disabled="busy" @click="choose('yearly')">
        <span class="tag">BEST VALUE</span>
        <b>Yearly · $29.99</b>
        <p class="muted">7-day free trial · $2.50 / month</p>
      </button>
      <button class="plan" :disabled="busy" @click="choose('monthly')">
        <b>Monthly · $4.99</b>
        <p class="muted">7-day free trial · cancel anytime</p>
      </button>
    </div>

    <p class="small danger center" v-if="error">{{ error }}</p>
    <p class="tiny muted center" v-if="busy">Talking to the App Store…</p>

    <button class="btn ghost wide sm" :disabled="busy" @click="restore">RESTORE PURCHASES</button>
    <p class="small muted center">
      Payment will be charged to your Apple ID at confirmation. Subscriptions auto-renew unless canceled at least 24 hours before the end of the period.
      {{ checkoutNote }}
    </p>
    <p class="tiny muted center">
      <button class="link" type="button" @click="legal = 'privacy'">Privacy</button>
      ·
      <button class="link" type="button" @click="legal = 'terms'">Terms</button>
      · No tracking of kids · Health is not medical advice
    </p>

    <div class="overlay" v-if="legal" @click.self="legal = null">
      <div class="sheet stack legal-sheet">
        <p class="tiny neon-text">{{ legal === 'privacy' ? 'PRIVACY' : 'TERMS' }}</p>
        <pre class="legal-copy">{{ legal === 'privacy' ? privacy : terms }}</pre>
        <button class="btn primary wide" @click="legal = null">GOT IT</button>
      </div>
    </div>
  </section>
</template>

<script>
import { PRODUCTS } from '../engine/rules.js'
import { purchaseMode, MANAGE_SUBSCRIPTIONS_URL } from '../engine/iap.js'
import { PRIVACY_TEXT, TERMS_TEXT } from '../engine/legal.js'

export default {
  name: 'PlusView',
  inject: ['game', 'store'],
  emits: ['subscribed'],
  data() {
    return {
      busy: false,
      error: '',
      legal: null,
      privacy: PRIVACY_TEXT,
      terms: TERMS_TEXT,
      manageUrl: MANAGE_SUBSCRIPTIONS_URL
    }
  },
  computed: {
    view() { return this.game.view },
    planLabel() {
      return this.view.subscription.plan === 'yearly' ? 'Plus Yearly' : 'Plus Monthly'
    },
    expiry() {
      if (!this.view.subscription.expiresAt) return 'with your trial'
      return new Date(this.view.subscription.expiresAt).toLocaleDateString()
    },
    checkoutNote() {
      return purchaseMode() === 'storekit'
        ? 'Purchases go through Apple In-App Purchase.'
        : 'This web preview uses a local demo receipt so you can try Plus immediately. The App Store build charges your Apple ID.'
    }
  },
  methods: {
    async choose(key) {
      this.busy = true
      this.error = ''
      try {
        const result = await this.store.purchasePlan(key)
        if (result.ok) this.$emit('subscribed', PRODUCTS[key].label)
        else if (result.reason === 'cancelled' || result.reason === 'pending') this.error = ''
        else this.error = result.message || 'Apple could not complete that purchase.'
      } finally {
        this.busy = false
      }
    },
    async restore() {
      this.busy = true
      this.error = ''
      try {
        const result = await this.store.restorePurchases()
        if (result.ok) this.$emit('subscribed', 'Restored')
        else this.error = 'No Plus receipt on this Apple ID yet.'
      } finally {
        this.busy = false
      }
    }
  }
}
</script>
