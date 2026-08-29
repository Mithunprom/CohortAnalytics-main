import { createApp, reactive } from 'vue'
import { Capacitor } from '@capacitor/core'
import App from './App.vue'
import { store } from './engine/store.js'
import '@fontsource/outfit/400.css'
import '@fontsource/outfit/600.css'
import '@fontsource/outfit/700.css'
import '@fontsource/outfit/800.css'
import '@fontsource/teko/500.css'
import '@fontsource/teko/600.css'
import '@fontsource/teko/700.css'
import './styles.css'

const game = reactive({ view: store.get() })
store.subscribe((view) => {
  game.view = view
})

const app = createApp(App)
app.provide('store', store)
app.provide('game', game)
app.mount('#app')

async function bootNative() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#05040c' })
  } catch { /* web or plugin missing */ }
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch { /* ignore */ }
}

bootNative()
