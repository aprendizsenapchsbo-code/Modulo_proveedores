import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import ViewProveedor from "../views/ViewProveedor.vue";
import registroExitoso from "../views/RegistroExitoso.vue";
import AprobacionPreRegistro from "../views/AprobarPreRegistro.vue"
import { createRouter, createWebHashHistory } from "vue-router";
import { useProveedorStore } from '../stores/proveedor.js';

const routes = [
    {path: '/', component: Login},
    {path: '/dashboard', component: Dashboard},
    {path: '/formulario-proveedor/', component: ViewProveedor},
    {path: '/registro-exitoso', component: registroExitoso},
    {path: '/aprobacion-pre-registro/:id', component: AprobacionPreRegistro},
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