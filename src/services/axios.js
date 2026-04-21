import axios from "axios";
import { useUsuarioStore } from "../stores/usuario.js"
import { router } from "../routes/router.js";

const apiClient = axios.create({
    baseURL: 'https://modulo-proveedores-backend.vercel.app/',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor de Petición 
apiClient.interceptors.request.use(
    (config) => {
        const usuarioStore = useUsuarioStore();
        if (usuarioStore.token) {
            config.headers.Authorization = `Bearer ${usuarioStore.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            
            // Obtener la ruta actual antes de limpiar el store
            const currentPath = router.currentRoute.value.fullPath;
            
            // Evitar bucle infinito: Si ya estamos en login no redirigir
            if (currentPath !== '/') {
                const usuarioStore = useUsuarioStore();

                // Limpiar el store
                usuarioStore.clearAuth();

                // Redirige al login guarando la ruta actual
                router.push({
                    path: '/',
                    query: { redirect: router.currentRoute.value.fullPath }
                });
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;