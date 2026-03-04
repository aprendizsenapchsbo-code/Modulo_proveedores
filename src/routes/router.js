import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {path: '/', component: Login},
    {path: '/dashboard', component: Dashboard},
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})