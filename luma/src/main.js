import { createApp, reactive } from 'vue'
import App from './App.vue'
import { store } from './engine/store.js'
import './styles.css'

const game = reactive({ view: store.get() })
store.subscribe((view) => {
  game.view = view
})

const app = createApp(App)
app.provide('store', store)
app.provide('game', game)
app.mount('#app')
