import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProveedorStore = defineStore('proveedor', () => {
    const tokenRegistro = ref(null);
    const idProveedor = ref(null);

    function setTokenRegistro(data) {
        tokenRegistro.value = data;
    }

    function setIdProveedor(data) {
        idProveedor.value = data;
    }

    return { tokenRegistro, setTokenRegistro, idProveedor, setIdProveedor }

}, {
    persist: true
})