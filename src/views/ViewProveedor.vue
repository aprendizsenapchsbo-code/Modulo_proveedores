<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useProveedorStore } from '../stores/proveedor.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';

const proveedorStore = useProveedorStore();
const nit = ref('');
const razonSocial = ref('');
const direccionNotificacion = ref('');
const telefono = ref('');
const ciudad = ref('');
const nombreRepresentante = ref('');
const numeroIdentificacion = ref('');
const telefonoRepresentante = ref('');
const correoElectronicoRepresentante = ref('');
const nombresApellidosResponsable = ref('');
const correoElectronicoResponsable = ref('');
const tipoContribuyente = ref('');
const tipoContribuyenteOptions = [
    { label: 'Persona Natural', value: 'Persona Natural' },
    { label: 'Persona Jurídica', value: 'Persona Jurídica' }
];
const autorizaDatosPersonales = ref(false);
const autorizaConflictos = ref(false);
const archivos = ref([]);
const loading = ref(false);
const intentoEnviar = ref(false);

onMounted(() => {
    console.log('Token proveedor en store:', proveedorStore.tokenRegistro);
})

async function limpiarFormulario() {
    nit.value = '';
    razonSocial.value = '';
    direccionNotificacion.value = '';
    telefono.value = '';
    ciudad.value = '';
    nombreRepresentante.value = '';
    numeroIdentificacion.value = '';
    telefonoRepresentante.value = '';
    correoElectronicoRepresentante.value = '';
    nombresApellidosResponsable.value = '';
    correoElectronicoResponsable.value = '';
    tipoContribuyente.value = '';
    autorizaDatosPersonales.value = false;
    autorizaConflictos.value = false;
    archivos.value = [];
}

async function crearRegistro() {
    loading.value = true;
    intentoEnviar.value = true;
    console.log('Token de registro:', proveedorStore.tokenRegistro); // Verificar el token antes de la solicitud

    if (!proveedorStore.tokenRegistro) {
        errorNotify('Token de registro no disponible. Por favor, asegúrese de haber recibido el correo de invitación y haber accedido al enlace proporcionado.');
        loading.value = false;
        return;
    }
    
    //Validar que haya al menos un archivo
    if (!archivos.value || archivos.value.length === 0) {
        errorNotify('Debe cargar al menos un documento.');
        loading.value = false;
        return;
    }

    try {
        // Subir primero los archivos a Cloudinary
        const documentosSubidos = await Promise.all(
            archivos.value.map(async (archivo) => {
                const formData = new FormData();
                formData.append('archivo', archivo);
                formData.append('tipo', archivo.name.split('.')[0]); //nombre del archivo como tipo

                const res = await axios.post(
                    'https://modulo-proveedores-backend.vercel.app/api/proveedor/upload',
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data'}}
                );
                return res.data.data;   
            })
        );

        const response = await axios.post(`https://modulo-proveedores-backend.vercel.app/api/proveedor/registro/completar/${proveedorStore.tokenRegistro}`, {
            NIT: nit.value,
            RazonSocial: razonSocial.value,
            DireccionNotificacion: direccionNotificacion.value,
            Telefono: telefono.value,
            Ciudad: ciudad.value,
            NombreRepresentante: nombreRepresentante.value,
            NumeroIdentificacion: numeroIdentificacion.value,
            TelefonoRepresentante: telefonoRepresentante.value,
            CorreoElectronicoRepresentante: correoElectronicoRepresentante.value,
            NombresApellidosResponsable: nombresApellidosResponsable.value,
            CorreoElectronicoResponsable: correoElectronicoResponsable.value,
            TipoContribuyente: tipoContribuyente.value,
            AutorizaDatosPersonales: autorizaDatosPersonales.value,
            AutorizaConflictos: autorizaConflictos.value,
            Documentos: documentosSubidos  //URLs reales de Cloudinary
        });
        console.log(response.data);

        if (!autorizaDatosPersonales.value || !autorizaConflictos.value) {
            errorNotify('Debe aceptar ambas autorizaciones para continuar con el registro.');
            loading.value = false;
            return;
        };

        limpiarFormulario();

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

                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input
                        class="inputNit"
                        style="width: 48%;"
                        filled
                        v-model="nit"
                        label="Número de Identificación Tributaria (NIT)"
                    />
                    <q-input
                        class="inputRazonSocial"
                        style="width: 48%;"
                        filled
                        v-model="razonSocial"
                        label="Razón Social"
                    />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información de Notificación</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input
                        style="width: 100%;"
                        filled
                        v-model="direccionNotificacion"
                        label="Dirección de Notificación"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="telefono"
                        label="Teléfono"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="ciudad"
                        label="Ciudad"
                    />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Representante Legal</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="nombreRepresentante"
                        label="Nombre del Representante Legal"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="numeroIdentificacion"
                        label="Número de Identificación del Representante"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="telefonoRepresentante"
                        label="Teléfono del Representante"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="correoElectronicoRepresentante"
                        label="Correo Electrónico del Representante"
                        type="email"
                    />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Responsable de Facturación</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input
                        style="width: 100%;"
                        filled
                        v-model="nombresApellidosResponsable"
                        label="Nombres y Apellidos del Responsable"
                    />
                    <q-input
                        style="width: 100%;"
                        filled
                        v-model="correoElectronicoResponsable"
                        label="Correo Electrónico del Responsable"
                        type="email"
                    />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Datos Adicionales</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-select
                        style="width: 48%;"
                        filled
                        v-model="tipoContribuyente"
                        :options="tipoContribuyenteOptions"
                        label="Tipo de Contribuyente"
                        emit-value
                        map-options
                    />
                    <div style="width: 48%; display: flex; flex-direction: column; gap: 8px;">
                        <q-checkbox
                            v-model="autorizaDatosPersonales"
                            label="Autorizo el tratamiento de datos personales"
                            :color="!autorizaDatosPersonales ? 'negative' : 'primary'"
                        />
                        <span v-if="intentoEnviar && !autorizaDatosPersonales" style="color: red; font-size: 12px;">
                            Debe aceptar la autorización de tratamiento de datos personales.
                        </span>

                        <q-checkbox
                            v-model="autorizaConflictos"
                            label="Autorizo la declaración de conflictos e intereses"
                            :color="!autorizaConflictos ? 'negative' : 'primary'"
                        />
                        <span v-if="intentoEnviar && !autorizaConflictos" style="color: red; font-size: 12px;">
                            Debe aceptar la autorización de declaración de conflictos e intereses.
                        </span>

                    </div>
                </div>

                <div class="q-mt-md" style="display: flex; flex-direction: column; gap: 12px;">
                    <p class="text-h6 text-secondary">Carga de Documentos</p>
                    <q-file
                        filled
                        bottom-slots
                        v-model="archivos"
                        multiple
                        hide-upload-btn
                        label="Haga clic para cargar o arrastre sus archivos"
                        style="min-height: 140px;"
                        accept=".pdf,.jpg,.jpeg,.png"
                        counter
                    />
                </div>

                <div class="boton q-mt-md" style="display: flex; justify-content: flex-end;">
                    <q-btn
                        type="submit"
                        :submit="true"
                        label="Guardar"
                        color="primary"
                        :loading="loading"
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