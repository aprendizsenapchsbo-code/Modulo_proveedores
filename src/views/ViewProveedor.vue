<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useProveedorStore } from '../stores/proveedor.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';

const proveedorStore = useProveedorStore();
const nit = ref('');
const razonSocial = ref('');
const loading = ref(false);

onMounted(() => {
    console.log('Token proveedor en store:', proveedorStore.tokenRegistro);
})

async function crearRegistro() {
    loading.value = true;
    console.log('Token de registro:', proveedorStore.tokenRegistro); // Verificar el token antes de la solicitud

    if (!proveedorStore.tokenRegistro) {
        errorNotify('Token de registro no disponible. Por favor, asegúrese de haber recibido el correo de invitación y haber accedido al enlace proporcionado.');
        loading.value = false;
        return;
    }

    try {
        const response = await axios.post(`http://localhost:3000/api/proveedor/registro/completar/${proveedorStore.tokenRegistro}`, {
            NIT: nit.value,
            RazonSocial: razonSocial.value
        });
        console.log(response.data);

        exitoNotify('Registro creado exitosamente');
    } catch (error) {
        console.error('Error al guardar el registro', error)
        errorNotify(error.response?.data?.msg || 'Error al guardar el registro')
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="pantallaProveedor bg-grey-2" style="height: 100vh;">
        <div class="titulo ">
            <h1 class="text-h3 text-weight-bold text-center text-secondary q-mb-md q-pt-md">Formulario de Proveedor</h1>
            <p class="text-body1 text-center text-grey-6 q-pb-md" style="width: 300px; margin: 0 auto;">
                Complete los datos generales y cargue la documentación requerida para mantener vigente su estado como proveedor
            </p>
        </div>

        <section style="width: 90%; margin: 0 auto; background-color: white; border: 1px solid #ccc; padding: 20px; border-radius: 10px;">
            <q-form @submit.prevent="crearRegistro" class="" >
                <p class="text-h5 text-secondary q-pb-md">Información General</p>

                <div class="input1y2" style="display: flex; justify-content: space-between; gap: 20px;">
                    <q-input
                    class="inputNit"
                    style="width: 50%;"
                    filled
                    v-model="nit"
                    label="Número de Identificación Tributaria (NIT)"
                    />
                    <q-input
                    class="inputRazonSocial"
                    style="width: 50%;"
                    filled
                    v-model="razonSocial"
                    label="Razón Social"
                    />
                </div>

                <div class="boton q-mt-md" style="display: flex; justify-content: flex-end;">
                    <q-btn
                    type="submit"
                    :submit="true"
                    label="Guardar"
                    color="primary"
                    />
                </div>
            </q-form>
        </section>
    </div>
</template>

<style scoped lang="scss">
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

</style>