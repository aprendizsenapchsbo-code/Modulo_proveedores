import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProveedorStore = defineStore('proveedor', () => {
    const tokenRegistro = ref(null);
    const idProveedor = ref(null);

    function setTokenRegistro(data) {
        console.log('Guardando token:', data);
        tokenRegistro.value = data;
    }

    function setIdProveedor(data) {
        console.log('Guardando idProveedor:', data);
        idProveedor.value = data;
    }

    function getIdProveedor() {
        return idProveedor.value;
    }

    function clearIdProveedor() {
        idProveedor.value = null;
    }

    return { 
        tokenRegistro, 
        setTokenRegistro, 
        idProveedor, 
        setIdProveedor,
        getIdProveedor,
        clearIdProveedor
    }

}, {
    persist: true
})