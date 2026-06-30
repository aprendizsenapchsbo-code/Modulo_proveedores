<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const tipo = route.query.tipo || 'invalido';
const correoSoporte = 'aprendiz.sena@pch-sbo.com';

const titulo = computed(() => 
    tipo === 'expirado'
        ? 'Enlace expirado'
        : 'Enlace inválido'
);

const mensaje = computed(() => 
    tipo === 'expirado'
        ? 'El enlace que intentas usar ha expirado. Los enlaces de registro son válidos por 7 días.'
        : 'El enlace que intentas usar no es válido o ya ha sido utilizado.'
);

function irInicio() {
    window.location.href = 'https://www.proveedor.pch-sbo.com';
}
</script>

<template>
    <div class="contenedor">
        <q-card class="q-pa-lg" style="max-width: 450px; width: 100%;">
            <div class="text-center">
                <!-- Icono -->
                <q-icon name="warning" color="warning" size="80px"/>

                <!-- Titulo -->
                 <h5 class="text-weight-bold text-grey-8 q-mt-md">
                    {{ titulo }}
                 </h5>

                 <!-- Mensaje -->
                  <p class="text-body1 text-grey-7">
                    {{ mensaje }}
                  </p>

                  <!-- Botón de ir al inicio -->
                  <div class="q-mt-lg">
                    <q-btn
                        label="Volver al inicio"
                        color="primary"
                        @click="irInicio"
                    />
                  </div>

                  <p class="text-caption text-grey-5 q-mt-lg">
                    Si necesita ayuda, contáctanos en
                    <a :href="`mailto:${correoSoporte}`" class="text-primary">
                        {{ correoSoporte }}
                    </a>
                  </p>
            </div>
        </q-card>
    </div>
</template>

<style scoped>
.contenedor {
    background-color: #f5f5f5;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}
</style>