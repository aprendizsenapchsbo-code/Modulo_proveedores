<script setup>
import { ref, computed } from 'vue'
import { useReenvioCorreo } from '../composables/useReenvioCorreo.js'
import { exitoNotify, errorNotify } from '../composables/Notify.js'

const showDialog = ref(false)

const {
    correos,
    loading,
    enviando,
    error,
    cargarCorreos,
    reenviarSeleccionados,
    haySeleccionados,
} = useReenvioCorreo()

// El botón Reenviar solo se habilita si hay al menos un correo seleccionado y no está enviando
const puedeReenviar = computed(() => haySeleccionados() && !enviando.value)

// Al abrir el diálogo, carga los correos desde la API (o mock)
async function abrirDialogo() {
    showDialog.value = true
    await cargarCorreos()
}

async function reenvioCorreo() {
    const exito = await reenviarSeleccionados()
    if (exito) {
        exitoNotify('Correo(s) reenviado(s) con éxito')
        showDialog.value = false
    } else {
        errorNotify(error.value || 'No se pudo reenviar los correos')
    }
}
</script>

<template>
    <div>
        <q-btn label="Reenviar Correo" color="primary" icon="email" @click="abrirDialogo" />
    </div>

    <div class="cuadroReenvio">
        <q-dialog 
            v-model="showDialog"
            transition-show="scale"
            transition-hide="scale"
        >
            <q-card class="q-pa-md" rounded style="min-width: 380px; max-width: 450px;">
                <q-card-section>
                    <div class="text-h6">Reenviar Correo</div>
                    <div class="text-caption text-grey">
                        Selecciona los destinatarios a los que deseas reenviar la invitación
                    </div>
                </q-card-section>

                <!-- Estado: cargando -->
                <q-card-section v-if="loading" class="flex flex-center q-py-lg">
                    <q-spinner color="primary" size="2em" />
                    <span class="q-ml-sm text-grey">Cargando correos...</span>
                </q-card-section>

                <!-- Estado: sin correos pendientes -->
                <q-card-section
                    v-else-if="!loading && correos.length === 0 && !error"
                    class="text-center text-grey q-py-md"
                >
                    No hay correos pendientes de reenvío
                </q-card-section>

                <!-- Estado: error al cargar -->
                <q-card-section v-else-if="error" class="text-negative q-py-md">
                    <q-icon name="error" /> {{ error }}
                </q-card-section>

                <!-- Lista de correos -->
                <q-card-section v-else class="q-pt-none">
                    <q-list separator>
                        <q-item
                            v-for="correo in correos"
                            :key="correo.correo"
                            dense
                            clickable
                            @click="correo.selected = !correo.selected"
                        >
                            <q-item-section avatar>
                                <q-checkbox v-model="correo.selected" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label>{{ correo.correo }}</q-item-label>
                                <q-item-label caption>{{ correo.estado }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-card-section>

                <q-card-actions align="right">
                    <q-btn
                        label="Reenviar"
                        color="primary"
                        :disable="!puedeReenviar"
                        :loading="enviando"
                        @click="reenvioCorreo"
                    />
                    <q-btn label="Cancelar" color="grey" flat @click="showDialog = false" />
                </q-card-actions>
            </q-card>
        </q-dialog>
    </div>
</template>