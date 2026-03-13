import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import ViewProveedor from "../views/ViewProveedor.vue";
import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {path: '/', component: Login},
    {path: '/dashboard', component: Dashboard},
    {path: '/formulario-proveedor', component: ViewProveedor},
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})