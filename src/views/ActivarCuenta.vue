<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import apiClient from '../services/axios.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';
import logo from '../assets/img/Logo_login.png';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const token = route.query.token;
const password = ref('');
const confirm = ref('');
const loading = ref(false);
const listo = ref(false);

const fuerza = computed(() => {
    const p = password.value;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s; // 0..4
});

const fuerzaLabel = computed(() =>  ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente'][fuerza.value]);
const fuerzaColor = computed(() => ['negative', 'negative', 'warning', 'positive', 'positive'][fuerza.value]);
const coinciden = computed(() => password.value === confirm.value && confirm.value !== '');

// Colores para cada nivel de fuerza
const getColorBarra = (nivel) => {
  if (nivel <= fuerza.value) {
    if (fuerza.value <= 1) return '#d9534f'; // rojo
    if (fuerza.value === 2) return '#f0a500'; // naranja
    return '#6FC33D'; // verde
  }
  return '#e0e0e0'; // gris
};

// Función activar
async function activar() {
    if (!token) return errorNotify('Enlace inválido');
    if (password.value.length < 8) return errorNotify('Mínimo 8 caracteres');
    if (!coinciden.value) return errorNotify('Las contraseñas no coinciden');
    loading.value = true;
    try {
        const { data } = await apiClient.post('api/usuario/activar', { token, password: password.value });
        listo.value = true;
        exitoNotify(data.msg || 'Cuenta activada');
    } catch (e) {
        errorNotify(e.response?.data?.msg || 'No se pudo activar la cuenta');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="activar-bg">
        <q-card class="activar-card" flat bordered>
            <div class="activar-franja">
                <img :src="logo" alt="PCH" class="activar-logo" />
                <div class="text-white text-weight-bold" style="font-size: 22px; letter-spacing: -0.4px;">
                {{ listo ? 'Cuenta lista' : 'Crea tu contraseña' }}
                </div>
            </div>

            <q-card-section v-if="!token" class="text-center q-pa-xl">
                <q-icon name="link_off" size="48px" color="negative" />
                <p class="q-mt-md text-grey-8">El enlace de activación no es válido.</p>
            </q-card-section>

            <q-card-section v-else-if="listo" class="text-center q-pa-xl">
                <q-icon name="task_alt" size="64px" color="positive" />
                <div class="text-h6 text-weight-bold q-mt-md" style="color: #142808;">¡Todo listo!</div>
                <p class="text-body2" style="color: #3a4a30;">Tu cuenta ya está activa.</p>
                <q-btn unelevated class="q-mt-md full-width" style="background: #3454D1; color: #fff; font-weight: 600;"
                label="Ir a iniciar sesión" @click="router.push('/')" />
            </q-card-section>

            <q-form v-else @submit.prevent="activar" class="q-pa-lg">
                <p class="text-body2 q-mb-lg" style="color: #3a4a30;">
                Define una contraseña segura para acceder al sistema
                </p>
                
                <q-input 
                v-model="password" 
                filled 
                type="password" 
                label="Nueva contraseña" 
                lazy-rules 
                :rules="[v => v.length >= 8 || 'Mínimo 8 caracteres']"
                >
                <template #append>
                    <q-icon name="lock" />
                </template>
                </q-input>
                
                <!-- Medidor de fuerza vivo -->
                <div class="q-mt-sm q-mb-md">
                <div class="row q-gutter-xs">
                    <div 
                    v-for="n in 4" 
                    :key="n" 
                    class="col"
                    :style="{ 
                        height: '5px', 
                        borderRadius: '3px', 
                        background: getColorBarra(n),
                        transition: 'background .25s ease' 
                    }" 
                    />
                </div>
                <div class="text-caption q-mt-xs" :class="`text-${fuerzaColor}`">{{ fuerzaLabel }}</div>
                </div>
                
                <q-input 
                v-model="confirm" 
                filled 
                type="password" 
                label="Repite la contraseña" 
                lazy-rules 
                :rules="[v => v === password || 'No coincide']"
                >
                <template #append>
                    <q-icon 
                    :name="coinciden ? 'check' : 'close'"
                    :color="coinciden ? 'positive' : 'negative'" 
                    />
                </template>
                </q-input>
                
                <q-btn 
                type="submit" 
                unelevated 
                class="q-mt-lg full-width" 
                :loading="loading" 
                :disable="loading || !coinciden || password.length < 8"
                style="background: #6fc33d; color: #142808; font-weight: 700;"
                label="Activar mi cuenta" 
                />
            </q-form>
        </q-card>
    </div>
</template>

<style scoped lang="scss">
.activar-bg {
    min-width: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: #f7fbf4;
    background-image: 
        radial-gradient(circle at 20% 20%, rgba(111, 195, 61, .12), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(52, 84, 209, .10), transparent 40%);
}

.activar-card {
    width: 100%;
    max-width: 440px;
    border-radius: 18px;
    overflow: hidden;
    border-color: #daead0;
}

.activar-franja {
    background: linear-gradient(125deg, #6fc33d 0%, #4f8f3a 50%, #3454d1 130%);
    padding: 26px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.activar-logo {
    width: 120px;
    filter: brightness(0) invert(1);
}
</style>