import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUsuarioStore = defineStore('usuario', () => {
    let usuario = ref(null);
    let token = ref(null);

    const estaAutenticado = computed(() => !!token.value)

    function setUsuario(data) {
        usuario.value = data;
    }

    function setToken(data) {
        token.value = data;
    }

    function clearAuth() {
        usuario.value = null;
        token.value = null;
    }

    return { usuario, token, estaAutenticado, setUsuario, setToken, clearAuth  }
}, {
    persist: {
        key: 'auth.store',
        storage: localStorage,
        paths: ['usuario']  //Solo persistir estos campos
    }
})