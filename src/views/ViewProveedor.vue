<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useProveedorStore } from '../stores/proveedor.js';
import { useAprobarPreRegistroStore } from '../stores/aprobarPreRegistro.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';
import { router } from '../routes/router.js';
import apiClient from '../services/axios.js';

const route = useRoute();
const proveedorStore = useProveedorStore();
const aprobacionPreRegistroStore = useAprobarPreRegistroStore();


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
    { label: 'Cédula de Ciudadanía', value: 'Cédula de Ciudadanía' },
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
const cargoResponsableFacturacion = ref('');
const correoElectronicoResponsable = ref('');
const tipoContribuyente = ref('');
const tipoContribuyenteOptions = [
    { label: 'Persona Natural', value: 'Persona Natural' },
    { label: 'Persona Jurídica', value: 'Persona Jurídica' }
];
const tipoProveedor = ref('');
const tipoProveedorOptions = [
    { label: 'Ferretería y Materiales de Construcción', value: 'Ferretería y materiales de construcción' },
    { label: 'Elementos de Protección Personal (EPP)', value: 'EPP' },
    { label: 'Servicios Generales', value: 'Servicios generales' },
    { label: 'Consultoría Ambiental', value: 'Consultoría ambiental' },
    { label: 'Suministros Industriales', value: 'Suministros industriales' },
    { label: 'Tecnología', value: 'Tecnología' },
    { label: 'Diseño de obras civiles', value: 'Diseño de obras civiles' },
    { label: 'Otro', value: 'Otro' }
]
const otroTipoProveedor = ref('')
const autorizaDatosPersonales = ref(false);
const autorizaConflictos = ref(false);

// Campos para la firma por checkbox
const firmaAceptadaDatosPersonales = ref(false);
const firmaAceptadaConflictos = ref(false);

// Fechas para los documentos de autorización de datos personales y conflictos de intereses
const fechaFirmaDatos = ref('');
const fechaFirmaConflictos = ref('');

// Variables para controlar si el dialogo a sido abierto
const dialogDatosAbierto = ref(false);
const dialogConflictosAbierto = ref(false);

const documentosRequeridos = ref([]);

// Array para almacenar los documentos obligatorios según el tipo de contribuyente
const documentosObligatorios = ref([]);

const loading = ref(false);
const intentoEnviar = ref(false);

const dialogDatos = ref(false);
const dialogConflictos = ref(false);

// Fecha actual autómatica
const fechaActual = new Date();
const dia = fechaActual.getDate();
const mes = fechaActual.toLocaleString('es-CO', { month: 'long' });
const año = fechaActual.getFullYear();

onMounted(() => {
    console.log('Token proveedor en store:', proveedorStore.tokenRegistro);
    const tokenFormUrl = route.params.token;
    if (!tokenFormUrl) {
        errorNotify('Enlace inválido: No se encontró el token de registro.');
    } else {
        proveedorStore.setTokenRegistro(tokenFormUrl);
    }
});

watch(tipoContribuyente, () => {
    obtenerDocumentosObligatorios();
})

async function limpiarFormulario() {
    nit.value = '';
    razonSocial.value = '';
    dv.value = '';
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
    cargoResponsableFacturacion.value = '';
    correoElectronicoResponsable.value = '';
    tipoContribuyente.value = '';
    tipoProveedor.value = '';
    autorizaDatosPersonales.value = false;
    autorizaConflictos.value = false;
    firmaAceptadaDatosPersonales.value = false;
    firmaAceptadaConflictos.value = false;
    dialogConflictosAbierto.value = false;
    dialogDatosAbierto.value = false;
    documentosRequeridos.value = [];
}

// Función para limpiar el campo "Otro" si cambian la selección
const limpiarOtroSiCambia = (nuevoValor) => {
    if (nuevoValor !== 'Otro') {
        otroTipoProveedor.value = '';
    }
};

async function crearRegistro() {
    loading.value = true;
    intentoEnviar.value = true;
    console.log('Token de registro:', proveedorStore.tokenRegistro); // Verificar el token antes de la solicitud

    const tokenRegistro = route.params.token;

    if (!tokenRegistro) {
        errorNotify('Sesión expirada o enlace inválido. Por favor, solicite un nuevo enlace de registro.');
        loading.value = false;
        return;
    }

    if (!autorizaDatosPersonales.value || !autorizaConflictos.value) {
        errorNotify('Debe leer y aceptar ambas autorizaciones para continuar con el registro.');
        // Abrir el diálogo que falta
        if (!autorizaDatosPersonales.value) dialogDatos.value = true;
        else if (!autorizaConflictos.value) dialogConflictos.value = true;
        loading.value = false;
        return;
    };

    //Validar que que cada documento obligatorio tenga un archivo asignado
    const documentosFaltantes = documentosRequeridos.value.filter(d => !d.archivo);
    if (documentosFaltantes.length > 0) {
        errorNotify(`Faltan ${documentosFaltantes.length} documento(s) por cargar.`);
        loading.value = false;
        return;
    }

    // Subir primero los archivos a Cloudinary
    try {
        const promesaSubida = documentosRequeridos.value.map(async (doc) => {
            const formData = new FormData();
            formData.append('archivo', doc.archivo);
            formData.append('tipo', doc.tipo);

            const res = await apiClient.post(
                'api/proveedor/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return res.data.data
            console.log(`Subido ${doc.tipo} - ${doc.archivo.name}`)
        });

        const urlsDocumentos = await Promise.all(promesaSubida);

        const response = await apiClient.post(`api/proveedor/registro/completar/${tokenRegistro}`, {
            NIT: nit.value,
            DV: dv.value,
            RazonSocial: razonSocial.value,
            DireccionNotificacion: direccionNotificacion.value,
            Telefono: telefono.value,
            Ciudad: ciudad.value,
            NombreRepresentante: nombreRepresentante.value,
            TipoDocumentoRepresentante: tipoDocumentoRepresentante.value,
            NumeroIdentificacion: numeroIdentificacion.value,
            TelefonoRepresentante: telefonoRepresentante.value,
            CorreoElectronicoRepresentante: correoElectronicoRepresentante.value,
            NombreRepresentanteComercial: nombreRepresentanteComercial.value,
            CargoRepresentanteComercial: cargoRepresentanteComercial.value,
            TelefonoRepresentanteComercial: telefonoRepresentanteComercial.value,
            CorreoElectronicoRepresentanteComercial: correoElectronicoRepresentanteComercial.value,
            NombresApellidosResponsable: nombresApellidosResponsable.value,
            CargoResponsableFacturacion: cargoResponsableFacturacion.value,
            CorreoElectronicoResponsable: correoElectronicoResponsable.value,
            TipoContribuyente: tipoContribuyente.value,
            TipoProveedor: tipoProveedor.value,
            OtroTipoProveedor: otroTipoProveedor.value,
            AutorizaDatosPersonales: autorizaDatosPersonales.value,
            AutorizaConflictos: autorizaConflictos.value,
            Documentos: urlsDocumentos  //URLs reales de Cloudinary
        });
        console.log(response.data);

        aprobacionPreRegistroStore.setIdProveedor(response.data._id);
        aprobacionPreRegistroStore.setPreRegistroAprobar(response.data);

        limpiarFormulario();

        exitoNotify('Registro creado exitosamente');
        // Redirigir a la pantalla de éxito
        router.push('/registro-exitoso');
    } catch (error) {
        console.error('Error al guardar el registro', error);
        
        // Manejo específico si el token expiró durante el proceso (401 o 403)
        if (error.response?.status === 401 || error.response?.status === 403) {
            errorNotify('El enlace de registro ha expirado o ya fue utilizado.');
        } else {
            errorNotify(error.response?.data?.msg || 'Error al guardar el registro. Intente nuevamente.');
        }
    } finally {
        loading.value = false;
    }
}

const manejarClickCheckbox = (val, tipo) => {
    // Si el checkbox se desmarca, actualizar el estado correspondiente
    if (val === false) {
        if (tipo === 'datos') {
            autorizaDatosPersonales.value = false;
            firmaAceptadaDatosPersonales.value = false; // Reiniciar la firma si se desmarca
        } else {
            autorizaConflictos.value = false;
            firmaAceptadaConflictos.value = false; // Reiniciar la firma si se desmarca
        }
        return;
    }

    // Si el checkbox se marca, verificar si el diálogo ya ha sido abierto antes
    if (tipo === 'datos') {
        dialogDatos.value = true;
        errorNotify('Por favor lea y firme la autorización dentro del diálogo');
    } else {
        dialogConflictos.value = true;
        errorNotify('Por favor lea y firme la autorización dentro del diálogo');

    }
};

const onDialogDatosOpen = () => {
    fechaFirmaDatos.value = new Date().toLocaleString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const onDialogConflictosOpen = () => {
    fechaFirmaConflictos.value = new Date().toLocaleString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Función para aceptar explicitamente
const aceptarYCerrarDatos = () => {
    if (!firmaAceptadaDatosPersonales.value) {
        errorNotify('Debe marcar la casilla de firma para aceptar');
        return;
    }
    dialogDatosAbierto.value = true;
    autorizaDatosPersonales.value = true;
    dialogDatos.value = false;
}

const aceptarYCerrarConflictos = () => {
    if (!firmaAceptadaConflictos.value) {
        errorNotify('Debe marcar la casilla de firma para aceptar');
        return;
    }
    dialogConflictosAbierto.value = true;
    autorizaConflictos.value = true;
    dialogConflictos.value = false;
}

const onDialogDatosClose = () => {
    dialogDatosAbierto.value = true; // Marcar que el diálogo de datos ha sido abierto
};

const onDialogConflictosClose = () => {
    dialogConflictosAbierto.value = true; // Marcar que el diálogo de conflictos ha sido abierto
};

function obtenerDocumentosObligatorios() {
    let docs = [];

    if (tipoContribuyente.value === 'Persona Jurídica') {
        docs = [
            'COPIA DE RUT COMPLETO',
            'COPIA DE CÁMARA COMERCIO VIGENTE (Menor a 90 días)',
            'COPIA DE DOCUMENTO DE IDENTIFICACION DEL REPRESENTANTE LEGAL',
            'CERTIFICACION BANCARIA',
            '2 CERTIFICADOS COMERCIALES',
            'ESTADOS FINANCIEROS COMPARATIVOS DE LOS (2) ÚLTIMOS AÑOS.'
        ];
    } else if (tipoContribuyente.value === 'Persona Natural') {
        docs = [
            'COPIA DE RUT COMPLETO',
            'COPIA DE DOCUMENTO DE IDENTIFICACION',
            'CERTIFICACION BANCARIA',
        ];
    }

    // Crear estructura con estado por documento
    documentosRequeridos.value = docs.map(tipo => ({
        tipo,
        archivo: null,
        url: null,
        subido: false
    }));

    console.log('documentosRequeridos inicializado:', documentosRequeridos.value);

}

</script>

<template>
    <div class="pantallaProveedor bg-grey-2" style="height: 100vh;">
        <div class="titulo ">
            <h1 class="text-h3 text-weight-bold text-center text-secondary q-mb-md q-pt-md">Formulario de Proveedor</h1>
            <p class="text-body1 text-center text-grey-6 q-pb-md" style="width: 300px; margin: 0 auto;">
                Complete los datos generales y cargue la documentación requerida para mantener vigente su estado como
                proveedor
            </p>
        </div>

        <section
            style="width: 90%; margin: 0 auto; background-color: white; border: 1px solid #ccc; padding: 20px; border-radius: 10px;">
            <q-form @submit.prevent="crearRegistro" class="">
                <p class="text-h5 text-secondary q-pb-md">Información General</p>

                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input class="inputNit" style="width: 42%;" filled v-model="nit"
                        label="Número de Identificación Tributaria (NIT)" />
                    <q-select class="inputCV" style="width: 6%; font-size: 12px;" filled v-model="dv"
                        :options="dvOpciones" label="DV" emit-value map-options>

                    </q-select>
                    <q-input class="inputRazonSocial" style="width: 48%;" filled v-model="razonSocial"
                        label="Razón Social" />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información de Notificación</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 100%;" filled v-model="direccionNotificacion"
                        label="Dirección de Notificación" />
                    <q-input style="width: 48%;" filled v-model="telefono" label="Teléfono" />
                    <q-input style="width: 48%;" filled v-model="ciudad" label="Ciudad" />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Representante Legal</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 48%;" filled v-model="nombreRepresentante"
                        label="Nombre del Representante Legal" />
                    <q-select style="width: 48%;" filled v-model="tipoDocumentoRepresentante"
                        :options="tipoDocumentoOptions" label="Tipo de Documento del Representante Legal" emit-value
                        map-options />
                    <q-input style="width: 48%;" filled v-model="numeroIdentificacion"
                        label="Número de Identificación del Representante Legal" />
                    <q-input style="width: 48%;" filled v-model="telefonoRepresentante"
                        label="Teléfono del Representante Legal" />
                    <q-input style="width: 48%;" filled v-model="correoElectronicoRepresentante"
                        label="Correo Electrónico del Representante Legal" type="email" />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información del Representante Comercial</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 48%;" filled v-model="nombreRepresentanteComercial"
                        label="Nombre del Representante Comercial" />
                    <q-input style="width: 48%;" filled v-model="cargoRepresentanteComercial"
                        label="Cargo del Representante Comercial" />
                    <q-input style="width: 48%;" filled v-model="telefonoRepresentanteComercial"
                        label="Teléfono del Representante Comercial" />
                    <q-input style="width: 48%;" filled v-model="correoElectronicoRepresentanteComercial"
                        label="Correo Electrónico del Representante Comercial" type="email" />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Responsable de Facturación</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 48%;" filled v-model="nombresApellidosResponsable"
                        label="Nombres y Apellidos del Responsable de Facturación" />
                    <q-input style="width: 48%;" filled v-model="cargoResponsableFacturacion"
                        label="Cargo del Responsable de Facturación" />
                    <q-input style="width: 100%;" filled v-model="correoElectronicoResponsable"
                        label="Correo Electrónico del Responsable de Facturación" type="email" />
                </div>

                <p class="text-h5 text-secondary q-pt-md q-pb-md">Datos Adicionales</p>
                <div class="input1y2" style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-select style="width: 48%;" filled v-model="tipoContribuyente" :options="tipoContribuyenteOptions"
                        label="Tipo de Contribuyente" emit-value map-options />
                    <q-select style="width: 48%;" filled v-model="tipoProveedor" :options="tipoProveedorOptions"
                        label="Tipo de Proveedor" emit-value map-options @update:model-value="limpiarOtroSiCambia" />

                    <!-- Input condicional (Solo aparece si es 'Otro') -->
                    <div style="width: 48%;" v-if="tipoProveedor === 'Otro'">
                        <q-input filled v-model="otroTipoProveedor" label="Especifique el tipo de proveedor"
                            placeholder="Ej: Consultoría Ambiental"
                            :rules="[val => !!val || 'Este campo es obligatorio']" lazy-rules class="bg-blue-1" />
                    </div>

                    <div style="width: 48%; display: flex; flex-direction: column; gap: 8px;">

                        <!-- Autorización de datos personales -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <q-checkbox :model-value="autorizaDatosPersonales"
                                @update:model-value="(val) => manejarClickCheckbox(val, 'datos')"
                                label="Autorizo el tratamiento de datos personales"
                                :color="!autorizaDatosPersonales ? 'negative' : 'primary'" />

                            <q-btn flat round dense icon="info" color="primary" size="sm" @click="dialogDatos = true" />
                        </div>
                        <span v-if="intentoEnviar && !autorizaDatosPersonales" style="color: red; font-size: 12px;">
                            Debe aceptar la autorización de tratamiento de datos personales.
                        </span>

                        <!-- Autorización de conflictos de intereses -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <q-checkbox :model-value="autorizaConflictos"
                                @update:model-value="(val) => manejarClickCheckbox(val, 'conflictos')"
                                label="Confirmo que he leído y acepto la declaración de conflictos de intereses"
                                :color="!autorizaConflictos ? 'negative' : 'primary'" />

                            <q-btn flat round dense icon="info" color="primary" size="sm"
                                @click="dialogConflictos = true" />
                        </div>
                        <span v-if="intentoEnviar && !autorizaConflictos" style="color: red; font-size: 12px;">
                            Debe aceptar la autorización de declaración de conflictos e intereses.
                        </span>

                    </div>
                </div>

                <div class="q-mt-md" style="display: flex; flex-direction: column; gap: 12px;">
                    <p class="text-h6 text-secondary">Carga de Documentos</p>

                    <!-- Lista de documentos obligatorios -->
                    <div v-if="tipoContribuyente" class="q-pa-sm bg-blue-1 rounded-borders">
                        <p class="text-weight-bold text-primary q-mb-xs">Documentos requeridos</p>

                        <div v-for="(doc, index) in documentosRequeridos" :key="doc.tipo" class="q-ml-md">
                            <p class="text-subtitle2 q-mb-xs">{{ doc.tipo }}</p>
                            {{ console.log(`Renderizando: ${doc.tipo}, archivo:`, doc.archivo) }}

                            <q-file class="q-mb-lg" v-model="doc.archivo" outlined dense hide-upload-btn
                                :label="doc.archivo ? doc.archivo.name : 'Seleccione archivo'"
                                accept=".pdf, .jpg, .jpeg, .png" :color="doc.archivo ? 'primary' : 'grey-5'">
                                <template v-if="doc.archivo" #append>
                                    <q-btn flat round dense icon="close" color="grey" @click="doc.archivo = null" />
                                </template>
                            </q-file>

                            <!-- Validación visual por campo -->
                            <span v-if="intentoEnviar && !doc.archivo" style="color: red; font-size: 12px;">
                                Este documento es obligatorio.
                            </span>
                        </div>
                    </div>
                    <p v-else class="text-body2 text-grey-6">
                        Seleccione el tipo de contribuyente para ver los documentos requeridos.
                    </p>

                    <!-- <div style="">
                        <q-file
                            v-model="archivosTemp"
                            @update:model-value="agregarArchivos"
                            multiple
                            hide-upload-btn
                            label="Haga clic para cargar o arrastre sus archivos"
                            style="border: 1px dashed #ccc;"
                            accept=".pdf,.jpg,.jpeg,.png"
                            counter
                        />
                    </div> -->

                    <!-- Asignación de tipo por archivo -->
                    <!-- <div v-if="archivos && archivos.length > 0">
                        <p class="text-weight-bold text-secondary q-mt-sm">
                            Asigne el tipo de documento para cada archivo cargado:
                        </p>

                        <div
                            v-for="(archivo, index) in archivos"
                            :key="index"
                            style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;"
                        >

                        <q-icon name="descripcion" color="primary" size="24px" />
                        <span class="text-body2" style="width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            {{ archivo.name }}
                        </span>
                        <q-select
                            style="width: 90%;"
                            filled
                            dense
                            v-model="tiposDocumentos[index]"
                            :options="documentosObligatorios"
                            label="Tipo de documento"
                            emit-value
                            map-options
                        />
                        </div>
                        <span v-if="intentoEnviar && tiposDocumentos.some(t => !t)" style="color: red; font-size: 12px;">
                            Debe asignar el tipo a todos los documentos.
                        </span>
                    </div> -->
                </div>

                <div class="boton q-mt-md" style="display: flex; justify-content: flex-end;">
                    <q-btn type="submit" :submit="true" label="Guardar" color="primary" :loading="loading" />
                </div>
            </q-form>
        </section>
    </div>

    <!-- Diálogo de autorización de datos personales -->
    <q-dialog v-model="dialogDatos" maximized persistent @show="onDialogDatosOpen" @hide="onDialogDatosClose">
        <q-card style="max-width: 700px; width: 100%; margin: auto;">
            <q-card-section class="bg-primary text-white">
                <div class="text-h6">Autorización de Datos Personales</div>
                <div class="text-subtitle2">PCH SAN BARTOLOME SAS ESP</div>
            </q-card-section>
            <q-card-section style="max-height: 70vh; overflow-y: auto;">
                <p>
                    Yo, <strong>{{ nombreRepresentante || '___________________' }}</strong>,
                    identificado como aparece al pie de mi firma, y actuando en representación legal de
                    <strong>{{ razonSocial || '___________________' }}</strong>
                    manifiesto expresamente mi consentimiento libre y expreso, para que
                    <strong>PCH SAN BARTOLOME SAS ESP</strong>, sociedad comercial con domicilio en
                    la Calle 70 # 7-30 Edificio Séptima Setenta en la ciudad de Bogotá D.C.,
                    como Responsable de la información, obtenga, use, almacene, y administre
                    la información personal que conozca, con ocasión a la relación comercial
                    vigente, para las siguientes finalidades:
                </p>
                <ol class="q-ml-md q-mt-sm">
                    <li>Creación y/o actualización de clientes y proveedores</li>
                    <li>Reporte de obligaciones tributarias y legales</li>
                    <li>Formalización de contratos</li>
                    <li>Gestión de pagos, cuentas por pagar, información exógena, reporte de impuestos</li>
                    <li>Suministro de servicios</li>
                    <li>Gestión Administrativa, manejo de información financiera, contable, fiscal y legal</li>
                    <li>Comunicaciones físicas y/o electrónicas con los empleados del cliente y del proveedor derivadas
                        de
                        la relación comercial</li>
                </ol>

                <p class="text-weight-bold q-mt-md q-mb-md">TRATAMIENTO DE LOS DATOS, DERECHOS DE TITULAR Y MEDIDAS DE
                    SEGURIDAD</p>
                <ul class="q-ml-md">
                    <li>Conozco que los datos que sobre mi se obtengan, serán administrados por <strong>PCH SAN
                            BARTOLOME
                            SAS ESP</strong>, con un nivel adecuado de protección,
                        asegurando la debida confidencialidad de dicha información y evitando la consulta por parte de
                        terceros no autorizados,
                        salvo que esta sea requerida por una entidad pública o administrativa en ejercicio de sus
                        funciones
                        legales o por orden judicial,
                        casos de urgencia médica o sanitaria o en aquellos casos regulados en el artículo 10 de la ley
                        1581
                        de 2012.</li>
                    <li>Conozco que la información personal que suministro, se encuentra almacenada en la oficina
                        principal
                        y/o sedes de <strong>PCH SAN BARTOLOME SAS ESP</strong>,
                        contando con todos las medidas de seguridad físicas, técnicas y administrativas para evitar su
                        perdida, adulteración, uso fraudulento o no adecuado.
                    </li>
                    <li>Declaro que <strong>PCH SAN BARTOLOME SAS ESP</strong>, ha puesto en mi conocimiento, el derecho
                        que
                        poseo como titular de la información entregada,
                        de recibir en cualquier momento información acerca del tratamiento dado a los datos entregados
                        y/o
                        de solicitar la actualización,
                        rectificación y/o supresión de los datos personales recolectados o la revocatoria de la
                        autorización
                        otorgada, lo cual podré solicitar
                        mediante un correo electrónico enviado a <strong>eticaycumplimiento@pch-sbo.com</strong> o una
                        comunicación dirigida a la dirección:
                        <strong>Calle 70 # 7-30</strong> Edificio Séptima Setenta de la ciudad de Bogotá.
                    </li>
                    <li>Conozco que <strong>PCH SAN BARTOLOME SAS ESP</strong>, cuenta con una politica de Protección de
                        Datos Personales la cual podré solicitar
                        a través del correo electrónico <strong>eticaycumplimiento@pch-sbo.com</strong>
                    </li>
                </ul>

                <p class="q-mt-md">
                    La presente autorización, se firma a los <strong>{{ dia }}</strong> días del mes de <strong>{{ mes
                    }}</strong> del año <strong>{{ año }}</strong>
                </p>
                <p>Nombre del Representante Legal: <strong>{{ nombreRepresentante || '___________________' }}</strong>
                </p>
                <p>Cédula de Ciudadanía: <strong>{{ numeroIdentificacion || '___________________' }}</strong></p>
            </q-card-section>

            <div class="q-mt-lg q-pa-md bg-grey-2 rounded-borders">
                <q-checkbox v-model="firmaAceptadaDatosPersonales"
                    label="Firmo digitalmente este documento al marcar esta casilla" color="primary" />
                <p>
                    Al aceptar, declaro que la información es verídica y doy mi consentimiento el {{ fechaFirmaDatos ||
                        '___________________' }}
                </p>

            </div>

            <q-card-actions align="right">
                <q-btn flat label="Cerrar sin aceptar" color="grey" v-close-popup />

                <q-btn flat label="He leído y acepto" color="primary" :disable="!firmaAceptadaDatosPersonales"
                    @click="aceptarYCerrarDatos" />
            </q-card-actions>

        </q-card>
    </q-dialog>

    <!-- Diálogo de autorización de conflictos de intereses -->
    <q-dialog v-model="dialogConflictos" maximized persistent @show="onDialogConflictosOpen"
        @hide="onDialogConflictosClose">
        <q-card style="max-width: 700px; width: 100%; margin: auto;">
            <q-card-section class="bg-primary text-white">
                <div class="text-h6">Declaración de Conflictos de Intereses</div>
                <div class="text-subtitle2">PCH SAN BARTOLOMÉ SAS ESP</div>
            </q-card-section>
            <q-card-section style="max-height: 80vh; overflow-y: auto;">
                <p>
                    Yo, <strong>{{ nombreRepresentante || '___________________' }}</strong>,
                    en calidad de representante de <strong>{{ razonSocial || '___________________' }}</strong>,
                    identificado(a) con <strong>{{ tipoDocumentoRepresentante || '___________________' }}</strong> y
                    <strong>{{ numeroIdentificacion || '___________________' }}</strong>,
                    actuando en nombre propio y/o en representación de mi empresa, declaro bajo la gravedad de juramento
                    lo
                    siguiente:
                </p>
                <ol class="q-ml-md">
                    <li class="text-weight-bold q-mt-md">Ausencia de Conflicto de Interés:</li>
                    <p>
                        Confirmo que, hasta la fecha, no existe ningún tipo de relación personal, financiera, laboral o
                        de
                        cualquier otra índole con empleados, representantes o accionistas de <strong>PCH SAN BARTOLOME
                            SAS
                            ESP</strong>,
                        que pueda generar un conflicto de intéres directo o indirecto en la relación comercial que
                        mantenemos.
                    </p>
                    <li class="text-weight-bold q-mt-md">Declaración de Situaciones Potenciales:</li>
                    <p>
                        En caso de que en el futuro surja alguna situación que pueda ser considerada un conflicto de
                        interés,
                        me comprometo a notifcar de manera inmediata y por escrito a <strong>PCH SAN BARTOLOME SAS
                            ESP</strong> para proceder a gestionar la situación según las políticas de la compañía.
                    </p>
                    <li class="text-weight-bold q-mt-md">Compromiso Ético</li>
                    <p>
                        Aseguro que todas las interacciones y transacciones realizadas entre <strong>{{ razonSocial ||
                            '___________________' }}</strong> y <strong>PCH SAN BARTOLOME SAS ESP</strong>
                        estarán alineados con principios éticos, legales y transparentes, buscando en todo momento la
                        equidad y el beneficio mutuo.
                    </p>
                </ol>
                <p class="q-mt-md">
                    La presente autorización, se firma a los <strong>{{ dia }}</strong> días del mes de <strong>{{ mes
                    }}</strong> del año <strong>{{ año }}</strong>
                </p>
                <p>Nombre del Representante Legal: <strong>{{ nombreRepresentante || '___________________' }}</strong>
                </p>
                <p>Cédula de Ciudadanía: <strong>{{ numeroIdentificacion || '___________________' }}</strong></p>
            </q-card-section>

            <div class="q-mt-lg q-pa-md bg-grey-2 rounded-borders">
                <q-checkbox v-model="firmaAceptadaConflictos"
                    label="Firmo digitalmente este documento al marcar esta casilla" color="primary" />
                <p>
                    Al aceptar, declaro que la información es verídica y doy mi consentimiento el {{
                        fechaFirmaConflictos ||
                        '___________________' }}
                </p>

            </div>

            <q-card-actions align="right">
                <q-btn flat label="Cerrar sin aceptar" color="grey" v-close-popup />

                <q-btn flat label="He leído y acepto" color="primary" :disable="!firmaAceptadaConflictos"
                    @click="aceptarYCerrarConflictos" />
            </q-card-actions>

        </q-card>
    </q-dialog>
</template>

<style scoped lang="scss">
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}
</style>