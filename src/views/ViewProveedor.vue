<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useProveedorStore } from '../stores/proveedor.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';
import { router } from '../routes/router.js';

const proveedorStore = useProveedorStore();
const nit = ref('');
const dv = ref('');
const dvOpciones = [
    { label: '0', value: '0' },
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
    { label: '5', value: '5' },
    { label: '6', value: '6' },
    { label: '7', value: '7' },
    { label: '8', value: '8' },
    { label: '9', value: '9' },
];
const razonSocial = ref('');
const direccionNotificacion = ref('');
const telefono = ref('');
const ciudad = ref('');
const nombreRepresentante = ref('');
const tipoDocumentoRepresentante = ref('');
const tipoDocumentoOptions = [
    { label: 'Cédula de Ciudadanía', value: 'Cédula de Ciudadnía' },
    { label: 'Cédula de Extranjería', value: 'Cédula de Extranjería' },
    { label: 'Pasaporte', value: 'Pasaporte' },
    { label: 'Otro', value: 'Otro' },
]
const numeroIdentificacion = ref('');
const telefonoRepresentante = ref('');
const correoElectronicoRepresentante = ref('');
const nombreRepresentanteComercial = ref('');
const cargoRepresentanteComercial = ref('');
const telefonoRepresentanteComercial = ref('');
const correoElectronicoRepresentanteComercial = ref('');
const nombresApellidosResponsable = ref('');
const correoElectronicoResponsable = ref('');
const tipoContribuyente = ref('');
const tipoContribuyenteOptions = [
    { label: 'Persona Natural', value: 'Persona Natural' },
    { label: 'Persona Jurídica', value: 'Persona Jurídica' }
];
const tipoProveedor = ref('');
const tipoProveedorOptions = [
    { label: 'Ferretería', value: 'Ferretería' },
    { label: 'Materiales de Construcción', value: 'Materiales de Construcción' },
    { label: 'Servicios Generales', value: 'Servicios Generales' },
    { label: 'Suministros Industriales', value: 'Suministros Industriales' },
    { label: 'Tecnología y Equipos', value: 'Tecnología y Equipos' },
]
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
    cv.value = '';
    direccionNotificacion.value = '';
    telefono.value = '';
    ciudad.value = '';
    nombreRepresentante.value = '';
    tipoDocumentoRepresentante.value = '';
    numeroIdentificacion.value = '';
    telefonoRepresentante.value = '';
    correoElectronicoRepresentante.value = '';
    nombreRepresentanteComercial.value = '';
    cargoRepresentanteComercial.value = '';
    telefonoRepresentanteComercial.value = '';
    correoElectronicoRepresentanteComercial.value = '';
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
                    'http://localhost:3001/api/proveedor/upload',
                    formData,
                    { headers: { 'Content-Type': 'multipart/form-data'}}
                );
                return res.data.data;   
            })
        );

        const response = await axios.post(`http://localhost:3001/api/proveedor/registro/completar/${proveedorStore.tokenRegistro}`, {
            NIT: nit.value,
            CV: cv.value,
            RazonSocial: razonSocial.value,
            DireccionNotificacion: direccionNotificacion.value,
            Telefono: telefono.value,
            Ciudad: ciudad.value,
            NombreRepresentante: nombreRepresentante.value,
            TipoDocuemntoRepresentante: tipoDocumentoRepresentante.value,
            NumeroIdentificacion: numeroIdentificacion.value,
            TelefonoRepresentante: telefonoRepresentante.value,
            CorreoElectronicoRepresentante: correoElectronicoRepresentante.value,
            NombreRepresentanteComercial: nombreRepresentanteComercial.value,
            CargoRepresentanteComercial: cargoRepresentanteComercial.value,
            TelefonoRepresentanteComercial: telefonoRepresentanteComercial.value,
            CorreoElectronicoRepresentanteComercial: correoElectronicoRepresentanteComercial.value,
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
        // Redirigir a la pantalla de éxito
        router.push('/registro-exitoso');
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
                        style="width: 42%;"
                        filled
                        v-model="nit"
                        label="Número de Identificación Tributaria (NIT)"
                    />
                    <q-select
                        class="inputCV"
                        style="width: 6%; font-size: 12px;"
                        filled
                        v-model="dv"
                        :options="dvOpciones"
                        label="DV"
                        emit-value
                        map-options>
                        
                    </q-select>
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
                    <q-select
                        style="width: 48%;"
                        filled
                        v-model="tipoDocumentoRepresentante"
                        :options="tipoDocumentoOptions"
                        label="Tipo de Documento del Representante"
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

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información del Representante Comercial</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="nombreRepresentanteComercial"
                        label="Nombre del Representante Comercial"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="cargoRepresentanteComercial"
                        label="Cargo del Representante Comercial"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="telefonoRepresentanteComercial"
                        label="Teléfono del Representante Comercial"
                    />
                    <q-input
                        style="width: 48%;"
                        filled
                        v-model="correoElectronicoRepresentanteComercial"
                        label="Correo Electrónico del Representante Comercial"
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
                    <q-select
                        style="width: 48%;"
                        filled
                        v-model="tipoProveedor"
                        :options="tipoProveedorOptions"
                        label="Tipo de Proveedor"
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
                            label="Confirmo que he leído y acepto la declaración de conflictos de intereses"
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