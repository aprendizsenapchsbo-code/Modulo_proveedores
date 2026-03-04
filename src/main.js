import { createApp } from 'vue'
import App from './App.vue'
import { Quasar } from 'quasar'
import { router } from './routes/router.js'

// import './style.css'

import '@quasar/extras/material-icons/material-icons.css'

import 'quasar/src/css/index.sass'

const myApp = createApp(App)

myApp.use(Quasar, {
    plugins: {},
})

myApp.use(router)
myApp.mount('#app')
