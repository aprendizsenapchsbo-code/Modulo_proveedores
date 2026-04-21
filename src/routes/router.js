import { createRouter, createWebHashHistory } from "vue-router";
// import { useProveedorStore } from '../stores/proveedor.js';
import { useUsuarioStore } from "../stores/usuario.js";

// import Login from "../views/Login.vue";
import Dashboard from "../views/Dashboard.vue";
import ViewProveedor from "../views/ViewProveedor.vue";
import registroExitoso from "../views/RegistroExitoso.vue";
import AprobacionPreRegistro from "../views/AprobarPreRegistro.vue"

const routes = [
    {path: '/', component: () => import('../views/Login.vue')},
    {path: '/dashboard', component: Dashboard, meta: {requiresAuth: true}},
    {path: '/formulario-proveedor/:token', component: ViewProveedor},
    {path: '/registro-exitoso', component: registroExitoso},
    {path: '/aprobacion-pre-registro/:id', component: AprobacionPreRegistro, meta: {requiresAuth: true}},
]

export const router = createRouter({
    history: createWebHashHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const usuarioStore = useUsuarioStore();

    const estaAutenticado = usuarioStore.estaAutenticado;

    if (to.meta.requiresAuth && !estaAutenticado){
        //Guardar la ruta completa a la que el usuario queria ir
        next({
            path: '/',
            query: { redirect: to.fullPath } // Ej: /login?redirect=/proveedor/pre-registro/123
        })
    } else {
        next()
    }
})
