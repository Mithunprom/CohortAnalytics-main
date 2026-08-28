<template>
  <div class="cosmos">
    <div class="phone" data-testid="luma-app">
      <div class="sky" :class="habitat"></div>
      <div class="stars"></div>
      <div class="scanlines"></div>
      <div class="shell">
        <header class="status">
          <span>LUMA</span>
          <span class="status-rank">{{ view.delveRank?.name || 'SCOUT' }} · {{ energyLabel }} · {{ plusLabel }}</span>
        </header>

        <Onboarding v-if="!view.profile.onboardingDone" @started="tab = $event || 'spark'" />

        <main class="content" v-else>
          <HomeView v-if="tab === 'home'" @open-spark="tab = 'spark'" @open-nest="tab = 'nest'" @open-play="tab = 'play'" />
          <SparkView v-else-if="tab === 'spark'" @need-plus="openPaywall" @celebrated="celebrate" />
          <SkyView v-else-if="tab === 'sky'" />
          <ArcadeView v-else-if="tab === 'play'" @need-plus="openPaywall" @celebrated="celebrate" />
          <NestView v-else-if="tab === 'nest'" @need-plus="openPaywall" />
          <PlusView v-else-if="tab === 'plus'" @subscribed="onSubscribed" />
        </main>

        <nav class="tabbar" v-if="view.profile.onboardingDone">
          <button v-for="item in tabs" :key="item.id" class="tab" :class="{ active: tab === item.id }" @click="tab = item.id">
            <span class="icon">{{ item.icon }}</span>
            {{ item.label }}
          </button>
        </nav>
      </div>

      <div class="overlay" v-if="paywall" @click.self="paywall = false">
        <div class="sheet stack">
          <h2>Out of energy</h2>
          <p class="muted">{{ paywallReason }}</p>
          <p>Plus is unlimited runs. That’s all it is. Rank is still earned in the Rift — we don’t sell power.</p>
          <button class="btn primary wide giant" @click="goPlus">UNLOCK PLUS</button>
          <button class="btn ghost wide sm" @click="paywall = false">NAH, I’LL WAIT</button>
        </div>
      </div>

      <div class="overlay" v-if="showCelebrate" @click="showCelebrate = false">
        <div class="sheet stack center">
          <div class="confetti">
            <i v-for="n in 14" :key="n" :style="confettiStyle(n)"></i>
          </div>
          <div class="luma-mini hero"><LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" mood="celebrate" /></div>
          <h2>{{ celebrateTitle }}</h2>
          <p class="muted">Streak {{ view.progress.streak }} · {{ view.delveRank?.name || view.stageName }} · {{ view.progress.exploreXp || 0 }} XP</p>
          <button class="btn primary wide giant" @click="showCelebrate = false">LET’S GO</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Onboarding from './components/Onboarding.vue'
import HomeView from './components/HomeView.vue'
import SparkView from './components/SparkView.vue'
import SkyView from './components/SkyView.vue'
import ArcadeView from './components/ArcadeView.vue'
import NestView from './components/NestView.vue'
import PlusView from './components/PlusView.vue'
import LumaCreature from './components/LumaCreature.vue'

export default {
  name: 'App',
  components: { Onboarding, HomeView, SparkView, SkyView, ArcadeView, NestView, PlusView, LumaCreature },
  inject: ['game'],
  data() {
    return {
      tab: 'home',
      paywall: false,
      paywallReason: '',
      showCelebrate: false,
      celebrateTitle: 'A new star.',
      tabs: [
        { id: 'home', label: 'Base', icon: '▣' },
        { id: 'spark', label: 'Spark', icon: '✶' },
        { id: 'sky', label: 'Sky', icon: '✧' },
        { id: 'play', label: 'Games', icon: '▶' },
        { id: 'plus', label: 'Plus', icon: '+' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    habitat() { return this.view.progress?.nest?.habitat || 'night' },
    plusLabel() { return this.view.plus ? 'PLUS' : 'FREE' },
    energyLabel() {
      if (this.view.plus) return '∞'
      const used = this.view.counters?.arcadePlaysToday || 0
      const limit = this.view.limits?.arcade ?? 2
      const left = Math.max(0, limit - used)
      return `${left} RUN${left === 1 ? '' : 'S'}`
    }
  },
  methods: {
    openPaywall(reason) {
      this.paywallReason = reason
      this.paywall = true
    },
    goPlus() {
      this.paywall = false
      this.tab = 'plus'
    },
    celebrate() {
      if (this.view.contractDone) this.celebrateTitle = 'Contract cleared'
      else if (this.view.progress.streak > 1) this.celebrateTitle = `${this.view.progress.streak}-day streak`
      else this.celebrateTitle = this.view.delveRank?.id ? `${this.view.delveRank.name} run banked` : 'Run banked'
      this.showCelebrate = true
    },
    onSubscribed() {
      this.celebrateTitle = 'Plus is live'
      this.showCelebrate = true
    },
    confettiStyle(n) {
      const colors = ['#c8ff3d', '#ff2bd6', '#3dffd2', '#eaff87', '#ff4ecd']
      return {
        left: `${8 + n * 6}%`,
        top: '20px',
        background: colors[n % colors.length],
        animationDelay: `${n * 0.04}s`
      }
    }
  }
}
</script>
