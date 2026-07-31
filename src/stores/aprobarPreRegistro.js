import { defineStore } from "pinia";
import { ref } from "vue";
import apiClient from "../services/axios.js";

export const useAprobarPreRegistroStore = defineStore("aprobacionPreRegistro", () => {
    const preRegistroAprobar = ref(null);
    const razonSocialProveedor = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Función para obtener el proveedor mediante el id
    async function proveedorData(razonSocial) {
        console.log('Proveedor encontrado: ', razonSocial)
        // Se guarda el ID localmente
        razonSocialProveedor.value = razonSocial;

        // Inicio de estado de carga
        loading.value = true;
        error.value = null;
        preRegistroAprobar.value = null;

        try {
            const response = await apiClient.get(`api/proveedor/${razonSocial}`)

            if (response.data.success) {
                preRegistroAprobar.value = response.data;
            } else {
                error.value = response.data.msg || 'No se pudo cargar la información del proveedor'
            }
            // Guardamos la respuesta del llamado
            console.log('Respuesta completa:', response);
            console.log('Datos del proveedor:', response.data);

        } catch (err) {
            console.error("Error al obtener datos del proveedor", err)
            error.value = err.response?.data?.msg || "No se pudo cargar la información del proveedor.";
        } finally {
            // Finalizamos la carga
            loading.value = false;
        }
    }

    function setPreRegistroAprobar(data) {
        preRegistroAprobar.value = data;
    }

    function setRazonSocialProveedor(razonSocial) {
        razonSocialProveedor.value = razonSocial;
    }

    function clearData() {
        preRegistroAprobar.value = null;
        razonSocialProveedor.value = null;
        error.value = null;
    }

    return {
        preRegistroAprobar,
        razonSocialProveedor,
        loading,
        error,
        proveedorData,
        setPreRegistroAprobar,
        setRazonSocialProveedor,
        clearData
    };

})