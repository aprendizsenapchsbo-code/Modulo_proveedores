import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useAprobarPreRegistroStore = defineStore("aprobacionPreRegistro", () => {
    const preRegistroAprobar = ref(null);
    const idProveedor = ref(null);
    const loading = ref(false);
    const error = ref(null);

    // Función para obtener el proveedor mediante el id
    async function proveedorData(id) {
        console.log('Proveedor enocntrado: ', id)
        // Se guarda el ID localmente
        idProveedor.value = id;

        // Inicio de estado de carga
        loading.value = true;
        error.value = null;
        preRegistroAprobar.value = null;

        try {
            const timestamp = new Date().getTime();
            const url = `https://modulo-proveedores-backend.vercel.app/api/proveedor/${id}?t=${timestamp}`;

            // Obtenemos la data llamando al backend
            const response = await axios.get(url);

            // Guardamos la respuesta del llamado
            console.log('Respuesta completa:', response);
            console.log('Datos del proveedor:', response.data.data);

            preRegistroAprobar.value = response.data;
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

    function setIdProveedor(id) {
        idProveedor.value = id;
    }

    function clearData() {
        preRegistroAprobar.value = null;
        idProveedor.value = null;
        error.value = null;
    }

    return {
        preRegistroAprobar,
        idProveedor,
        loading,
        error,
        proveedorData,
        setPreRegistroAprobar,
        setIdProveedor,
        clearData
    };

})