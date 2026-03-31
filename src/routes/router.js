import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import ViewProveedor from "../views/ViewProveedor.vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { useProveedorStore } from '../stores/proveedor.js';

const routes = [
    {path: '/', component: Login},
    {path: '/dashboard', component: Dashboard},
    {path: '/formulario-proveedor/', component: ViewProveedor},
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// Obtener el token antes de entrar a la ruta del formulario de proveedor
router.beforeEach((to, from, next) => {
    if (to.params.token) {
        const proveedorStore = useProveedorStore();
        proveedorStore.setTokenRegistro(to.params.token);
    }
    next();
})