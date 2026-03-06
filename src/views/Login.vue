<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

import { exitoNotify, errorNotify } from '../composables/Notify';
import { useUsuarioStore } from '../stores/usuario';

const email = ref('')
const password = ref('')
const isPwd = ref(true)
const loading = ref(false)
const usuarioStore = useUsuarioStore()
const router = useRouter()

// Validaciones de rules
const emailRules = [
    val => (val && val.length > 0) || 'El campo email es obligatorio',
    val => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !val || pattern.test(val) || 'El formato del email no es válido'
    }
]
const passwordRules = [
    val => (val && val.length > 0) || 'El campo contraseña es obligatorio'
]

async function login() {
    loading.value = true
    try {

        const r = await axios.post("http://localhost:3000/api/usuario/login", {
            email: email.value,
            password: password.value
        });

        console.log("Login exitoso: ", r.data.data.usuario);
        // console.log("Token: ", r.data.data.token);

        usuarioStore.setUsuario(r.data.data.usuario); // Guardar el usuario en el store
        usuarioStore.setToken(r.data.data.token); // Guardar el token en el store

        // console.log('Usuario guardado:', usuarioStore.usuario);
        // console.log('Token guardado:', usuarioStore.token);

        exitoNotify(`¡Bienvenido, ${usuarioStore.usuario.nombre}!`);

        router.push('/dashboard')
        
    } catch (error) {
        console.error("Error al iniciar sesión", error.response?.data || error);
        errorNotify(error.response?.data?.msg || 'Error al iniciar sesión');
    
    } finally {
        loading.value = false;
    }
}

</script>

<template>
    <div class="login-wrapper">
        <div class="Formulario">
            <h1 class="titulo">Sistema Gestión de Proveedores</h1>

            <div class="logoLogin">
                <img class="logo q-mb-xl" src="../assets/Logo_login.png" alt="Logo_del_Login">
            </div>

            <q-form @submit.prevent="login">
                <div class="form">
                    <q-input class="q-mb-md bg-clear input" v-model="email" filled lazy-rules :rules="emailRules"
                        type="email" label="Email" />

                    <q-input class="q-mb-xl input" v-model="password" filled lazy-rules :rules="passwordRules"
                        :type="isPwd ? 'password' : 'text'" label="Password">
                        <template v-slot:append>
                            <q-icon :name="isPwd ? 'visibility_off' : 'visibility'" class="cursor-pointer"
                                @click="isPwd = !isPwd" />
                        </template>
                    </q-input>
                </div>

                <div class="botonIniciar">
                    <q-btn 
                    class="botonLogin q-mb-xl" 
                    :loading="loading"
                    type="submit" 
                    text-color="white" 
                    label="Iniciar Sesión"
                    />
                </div>
            </q-form>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.login-wrapper {
    background: linear-gradient(#0a2833 0%, #3454d1 50%, #6BBB6B 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}

.Formulario {
    display: flex;
    flex-direction: column;
    padding: 0 20px;
    height: auto;
    max-width: 400px;
    margin: 50px auto;
    border-radius: 45px;
    background-color: white;
}

.titulo {
    text-align: center;
    font-size: 23px;
    color: #6BBB6B;
}

.logoLogin {
    display: flex;
    justify-content: center;
    align-items: center;
}

.logo {
    border-radius: 50%;
    object-fit: contain;
    width: 200px;
    height: 200px;
    background-color: white;
    box-shadow: 0px 2px 4px rgba($color: #000000, $alpha: 0.7);
}

.form {
    display: flex;
    flex-direction: column;
    // border: 1px solid rgb(131, 131, 131);
    // border-radius: 10px;
}

.botonLogin {
    display: flex;
    justify-self: center;
    background-color: #6BBB6B;
    border-radius: 10px;
}
</style>