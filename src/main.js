import { createApp } from 'vue'
import App from './App.vue'
import { Quasar, Notify } from 'quasar'
import { router } from './routes/router.js'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// import './style.css'

import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)
const myApp = createApp(App)

myApp.use(Quasar, {
    plugins: { Notify },
})

myApp.use(pinia)
myApp.use(router)
myApp.mount('#app')
