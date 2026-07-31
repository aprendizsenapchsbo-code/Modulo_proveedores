import { ref } from "vue";
import apiClient from "../services/axios.js";
import { useUsuarioStore } from "../stores/usuario.js";

export function useProveedoresPaginados(limit = 10) {
    const proveedores = ref([])
    const loading = ref(false)
    const error = ref(null)
    const hasMore = ref(false)
    const nextSkipToken = ref(null)

    const usuarioStore = useUsuarioStore()

    const cargarPagina = async (skipToken = null) => {
        if (loading.value) return
        loading.value = true
        error.value = null

        try {
            const headers = { 'x-token': usuarioStore.token }
            const params = { limit }
            if (skipToken) params.skipToken = skipToken

            const response = await apiClient.get('/api/proveedor', { params, headers })
            const { data, hasMore: hasMoreData, nextSkipToken: nextToken } = response.data

            if (!skipToken) {
                proveedores.value = data
            } else {
                proveedores.value = [...proveedores.value, ...data]
            }

            hasMore.value = hasMoreData
            nextSkipToken.value = nextToken

            return response.data
        
        } catch (err) {
            error.value = err.response?.data?.msg || err.message || 'Error al cargar proveedores'
            console.error('Error en cargarPagina:', err)
            throw err
        } finally {
            loading.value = false
        }
    }

    const cargarSiguiente = async () => {
        if (!hasMore.value || loading.value) return
        await cargarPagina(nextSkipToken.value)
    }

    const reset = () => {
        proveedores.value = []
        hasMore.value = false
        nextSkipToken.value = null
        error.value = null
    }

    const recargar = async () => {
        reset()
        await cargarPagina()
    }

    return {
        proveedores,
        loading,
        error,
        hasMore,
        nextSkipToken,
        cargarPagina,
        cargarSiguiente,
        reset,
        recargar
    }
}