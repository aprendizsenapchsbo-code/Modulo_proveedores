import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUsuarioStore = defineStore('usuario', () => {
    let usuario = ref(JSON.parse(localStorage.getItem('usuario')) || null);
    let token = ref(localStorage.getItem('token') || null);

    function setUsuario(data) {
        usuario.value = data;
        localStorage.setItem('usuario', JSON.stringify(data));
    }

    function setToken(data) {
        token.value = data;
        localStorage.setItem('token', data);
    }

    function clearUsuario() {
        usuario.value = null;
        localStorage.removeItem('usuario');
    }

    function clearToken() {
        token.value = null;
        localStorage.removeItem('token');
    }

    return { usuario, token, setUsuario, setToken, clearUsuario, clearToken }
}, {
    persist: true
})