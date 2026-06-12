import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useProveedorStore = defineStore('proveedor', () => {
    const tokenRegistro = ref(null);
    const razonSocialProveedor = ref(null);

    function setTokenRegistro(data) {
        console.log('Guardando token:', data);
        tokenRegistro.value = data;
    }

    function setRazonSocialProveedor(data) {
        console.log('Guardando razonSocialProveedor:', data);
        razonSocialProveedor.value = data;
    }

    function getRazonSocialProveedor() {
        return razonSocialProveedor.value;
    }

    function clearRazonSocialProveedor() {
        razonSocialProveedor.value = null;
    }

    return { 
        tokenRegistro, 
        setTokenRegistro, 
        razonSocialProveedor, 
        setRazonSocialProveedor,
        getRazonSocialProveedor,
        clearRazonSocialProveedor
    }

}, {
    persist: true
})