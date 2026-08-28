<template>
  <div class="cosmos">
    <div class="phone" data-testid="luma-app">
      <div class="sky" :class="habitat"></div>
      <div class="stars"></div>
      <div class="shell">
        <header class="status">
          <span>LUMA</span>
          <span>{{ plusLabel }}</span>
        </header>

        <Onboarding v-if="!view.profile.onboardingDone" @started="tab = 'spark'" />

        <main class="content" v-else>
          <HomeView v-if="tab === 'home'" @open-spark="tab = 'spark'" @open-nest="tab = 'nest'" />
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
          <h2>Keep the lantern lit</h2>
          <p class="muted">{{ paywallReason }}</p>
          <p>Plus is how Luma stays ad-free and how you earn from the App Store: a clear, cancelable subscription.</p>
          <button class="btn primary wide" @click="goPlus">See Luma Plus</button>
          <button class="btn ghost wide" @click="paywall = false">Maybe later</button>
        </div>
      </div>

      <div class="overlay" v-if="showCelebrate" @click="showCelebrate = false">
        <div class="sheet stack center">
          <div class="confetti">
            <i v-for="n in 14" :key="n" :style="confettiStyle(n)"></i>
          </div>
          <LumaCreature :stage="view.stage" :skin="view.progress.nest.skin" mood="celebrate" />
          <h2>{{ celebrateTitle }}</h2>
          <p class="muted">Streak {{ view.progress.streak }} · {{ view.stageName }}</p>
          <button class="btn primary wide" @click="showCelebrate = false">Beautiful</button>
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
        { id: 'home', label: 'Home', icon: '✦' },
        { id: 'spark', label: 'Spark', icon: '✶' },
        { id: 'sky', label: 'Sky', icon: '✧' },
        { id: 'play', label: 'Play', icon: '★' },
        { id: 'plus', label: 'Plus', icon: '+' }
      ]
    }
  },
  computed: {
    view() { return this.game.view },
    habitat() { return this.view.progress?.nest?.habitat || 'night' },
    plusLabel() { return this.view.plus ? 'PLUS' : 'FREE' }
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
      this.celebrateTitle = this.view.progress.streak > 1 ? `${this.view.progress.streak}-day glow` : 'A new star.'
      this.showCelebrate = true
    },
    onSubscribed() {
      this.celebrateTitle = 'Plus lantern lit'
      this.showCelebrate = true
    },
    confettiStyle(n) {
      const colors = ['#ffe08a', '#ffb36b', '#5eead4', '#c4b5fd', '#f9a8d4']
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
