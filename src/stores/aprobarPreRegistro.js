import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useAprobarPreRegistroStore = defineStore("aprobacionPreRegistro", () => {
    const preRegistroAprobar = ref(null);
    const idProveedor = ref(null);

    

    function setPreRegistroAprobar(data) {
        preRegistroAprobar.value = data;
    }

    function setIdProveedor(data) {
        idProveedor.value = data;
    }

    return {
        preRegistroAprobar,
        idProveedor,
        setPreRegistroAprobar,
        setIdProveedor
    };

}, {
    persist: true
})