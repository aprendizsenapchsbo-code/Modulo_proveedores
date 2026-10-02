import { ref } from 'vue'
import apiClient from '../services/axios.js'

// ─────────────────────────────────────────────────────────────────────────────
// Datos mock: se usan cuando la API no está disponible (sin variables de entorno)
// Reemplazar por los campos reales que devuelva el endpoint cuando estén disponibles
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_CORREOS = [
    { correo: 'proveedor1@example.com', estado: 'Invitacion enviada' },
    { correo: 'proveedor2@example.com', estado: 'Pendiente actualizacion' },
    { correo: 'proveedor3@example.com', estado: 'Invitacion enviada' },
    { correo: 'proveedor4@example.com', estado: 'Pendiente actualizacion' },
]

// Cambiar a false cuando la API esté disponible y las variables de entorno estén configuradas
const USAR_MOCK = false

export function useReenvioCorreo() {
    const correos = ref([])
    const loading = ref(false)
    const enviando = ref(false)
    const error = ref(null)

    /**
     * Obtiene los correos pendientes desde la API.
     * Filtra solo los que tienen estado "Invitacion enviada" o "Pendiente actualizacion".
     * TODO: reemplazar '/api/correos/pendientes' por el endpoint real cuando esté disponible.
     */
    const cargarCorreos = async () => {
        loading.value = true
        error.value = null
        correos.value = []

        try {
            if (USAR_MOCK) {
                // Simulación de llamada asíncrona con datos mock
                await new Promise(resolve => setTimeout(resolve, 400))
                correos.value = MOCK_CORREOS.map(c => ({ ...c, selected: false }))
                return
            }

            // Reutiliza el endpoint existente /api/proveedor/buscar
            const response = await apiClient.get('/api/proveedor/buscar')
            const data = response.data?.data ?? response.data

            correos.value = data
                .filter(p => {
                    const esInvitacion = (p.estado && p.estado.toLowerCase() === 'invitación_enviada') ||
                                        (p.estadoProveedor && p.estadoProveedor.toLowerCase() === 'invitacion enviada')
                    const esActualizacion = p.estadoProveedor &&
                                            (p.estadoProveedor.toLowerCase() === 'pendiente actualización' ||
                                            p.estadoProveedor.toLowerCase() === 'pendiente actualizacion')
                    return (esInvitacion || esActualizacion) && p.CorreoElectronico
                })
                .map(p => {
                    const esInvitacion = (p.estado && p.estado.toLowerCase() === 'invitación_enviada') ||
                                        (p.estadoProveedor && p.estadoProveedor.toLowerCase() === 'invitacion enviada')
                    return {
                        correo: p.CorreoElectronico,
                        estado: esInvitacion ? 'Invitacion enviada' : 'Pendiente actualizacion',
                        razonSocial: p.RazonSocial || null,
                        selected: false
                    }
                })

        } catch (err) {
            error.value = err.response?.data?.msg || err.message || 'Error al cargar los correos'
            console.error('useReenvioCorreo – cargarCorreos:', err)
        } finally {
            loading.value = false
        }
    }

    /**
     * Envía los correos seleccionados a la API.
     * @returns {boolean} true si el reenvío fue exitoso, false si falló
     */
    const reenviarSeleccionados = async () => {
        const seleccionados = correos.value
            .filter(c => c.selected)
            .map(c => c.correo)

        if (seleccionados.length === 0) return false

        enviando.value = true
        error.value = null

        try {
            if (USAR_MOCK) {
                // Simulación de envío exitoso con datos mock
                await new Promise(resolve => setTimeout(resolve, 600))
                console.log('[MOCK] Correos que se reenviarían:', seleccionados)
                return true
            }

            // Endpoint real en backend
            await apiClient.post('/api/proveedor/reenviar-correos', { correos: seleccionados })
            return true

        } catch (err) {
            error.value = err.response?.data?.msg || err.message || 'Error al reenviar los correos'
            console.error('useReenvioCorreo – reenviarSeleccionados:', err)
            return false
        } finally {
            enviando.value = false
        }
    }

    const haySeleccionados = () => correos.value.some(c => c.selected)

    return {
        correos,
        loading,
        enviando,
        error,
        cargarCorreos,
        reenviarSeleccionados,
        haySeleccionados,
    }
}
