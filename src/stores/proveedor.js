import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProveedorStore = defineStore('proveedor', () => {
    const tokenRegistro = ref(null);

    function setTokenRegistro(data) {
        tokenRegistro.value = data;
    }

    return { tokenRegistro, setTokenRegistro }

}, {
    persist: true
})