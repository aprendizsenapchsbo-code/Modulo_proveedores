<script setup>
import { onMounted, ref, watch } from 'vue';
import axios from 'axios';
import { useRoute } from 'vue-router';
import { useAprobarPreRegistroStore } from '../stores/aprobarPreRegistro.js';
import { useUsuarioStore } from '../stores/usuario.js';
import { errorNotify, exitoNotify } from '../composables/Notify.js';
import apiClient from '../services/axios.js';

const route = useRoute()
const aprobarPreRegistro = useAprobarPreRegistroStore();
const usuarioStore = useUsuarioStore();
const evaluaciones = ref([]);
const loading = ref(false);
const comentario = ref('');

watch(
    () => aprobarPreRegistro.preRegistroAprobar,
    (newData) => {
        if (newData?.data?.Documentos) {
            evaluaciones.value = newData.data.Documentos.map(() => null)
        } else {
            evaluaciones.value = []
        }

    },
    { immediate: true }
)

function validarDocumentos() {
    if(!evaluaciones.value.length) {
        return { valido: false, mensaje: 'No hay documentos para evaluar' }
    }
    if(!evaluaciones.value.every(val => val === 'bien' || val === 'mal')) {
        return { valido: false, mensaje: 'Debe evaluar todos los documentos' }
    }
    if(evaluaciones.value.every(val => val === 'bien')) {
        return { valido: true, aprobar: true }
    }
    return { valido: true, aprobar: false }
};

async function procesarAprobacion() {
    const resultado = validarDocumentos();
    
    if(!resultado.valido) {
        errorNotify(resultado.mensaje);
        return;
    }
    
    if(resultado.aprobar) {
        aprobarProveedor()
    } else {
        rechazarProveedor()
    }
}

const optionsEstado = [
    'Pre-registro', 'Registrado', 'Actualizado', 'Pendiente Actualización', 'Inactivo'
]

// Función para cargar el pre-registro
const cargaData = () => {
    const id = route.params.id;
    if (id) {
        aprobarPreRegistro.proveedorData(id);
    } else {
        aprobarPreRegistro.error = "No se proporcionó un ID de proveedor válido."
    }
};

// Función para aprobar el proveedor
async function aprobarProveedor() {
    loading.value = true;
    const tokenRaw = usuarioStore.token;
    const token = tokenRaw?.value ?? tokenRaw ?? localStorage.getItem('token');

    if (!token) {
        loading.value = false;
        errorNotify('Token no disponible. Inicia sesión de nuevo.');
        return;
    }

    try {
        const res = await apiClient.post(
            `api/proveedor/aprobar/pre-registro/${aprobarPreRegistro.idProveedor}`,
            {},
            {
                headers: {
                    'x-token': token
                }
            }
        );
        console.log(res);
        exitoNotify(res.msg)
    } catch (error) {
        console.log('Error al aprobar el proveedor: ', error);
        errorNotify(error.response?.data?.msg || 'Error al aprobar el proveedor');
    } finally {
        loading.value = false;
    }
    console.log('Aprobando...', aprobarPreRegistro.idProveedor);
};

// Función para no aprobar el proveedor
async function rechazarProveedor () {
    loading.value = true;
    const tokenRaw = usuarioStore.token;
    const token = tokenRaw?.value ?? tokenRaw ?? localStorage.getItem('token');

    if (!token) {
        loading.value = false;
        errorNotify('Token no disponible. Inicia sesión de nuevo.');
        return;
    }

    try {
        const res = await apiClient.post(`api/proveedor/rechazar/pre-registro/${aprobarPreRegistro.idProveedor}`,
            {comentario: comentario.value},
            {
                headers: {
                    'x-token': token
                }
            }
        );
        console.log(res)
        exitoNotify(res.data.msg)
    } catch (error) {
        console.log('Error al rechazar el pre-registro: ', error);
        errorNotify(error.response?.data?.msg || 'Error al rechazar el pre-registro');
    } finally {
        loading.value = false;
    }
    console.log('Rechazando...', aprobarPreRegistro.idProveedor)
};

const recargar = () => {
    cargaData();
}

onMounted(() => {
    cargaData();
});

const getFormatoDeUrl = (url) => {
    if (!url) return '';
    // La URL de Cloudinary termina en /nombre.extension
    return url.split('.').pop()?.split('?')[0]?.toLowerCase() || '';
};

// Función para determinar el icono según la extensión del archivo
const getIconDocumento = (nombreArchivo, formato = '', url = '') => {
    const extensionNombre = nombreArchivo?.split('.').pop()?.toLowerCase();
    const extensionUrl = getFormatoDeUrl(url);
    
    const extension = formato || extensionNombre || extensionUrl;

    const iconos = {
        pdf: 'picture_as_pdf',
        jpg: 'image', jpeg: 'image', png: 'image', webp: 'image',
        doc: 'description', docx: 'description',
        xls: 'table_chart', xlsx: 'table_chart',
        zip: 'folder_zip', rar: 'folder_zip'
    };
    return iconos[extension] || 'attach_file';
};

// Función para color según tipo de documento
const getColorDocumento = (tipo) => {
    const colores = {
        'COPIA DE RUT COMPLETO': 'primary',
        'COPIA DE CÁMARA COMERCIO VIGENTE (Menor a 90 días)': 'secondary',
        'CERTIFICACION BANCARIA': 'positive',
        'COPIA DE DOCUMENTO DE IDENTIFICACION': 'warning',
        'COPIA DE DOCUMENTO DE IDENTIFICACION DEL REPRESENTANTE LEGAL': 'warning',
        '2 CERTIFICADOS COMERCIALES': 'info',
        'ESTADOS FINANCIEROS COMPARATIVOS DE LOS (2) ÚLTIMOS AÑOS.': 'negative'
    };
    return colores[tipo] || 'grey-7';
};

// Función para abrir el documento en una nueva pestaña
const abrirDocumento = (url) => {
    if (!url) {
        errorNotify('URL del documento no disponible')
        return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
};

// Función para forzar la descarga del documento
const descargarDocumento = (url, nombre) => {
    if (!url) {
        errorNotify('URL del documento no disponible')
        return;
    }
    // Crear link temporal para forzar descarga
    const link = document.createElement('a');
    link.href = url;
    link.download = nombre || 'documento';
    link.target = 'noopener,noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link)
};


</script>

<template>
    <div class="pantalla">
        <h1 class="text-h4 text-center text-accent">Validación del proveedor</h1>

        <div v-if="aprobarPreRegistro.loading" class="text-center">
            <span><q-spinner-tail color="blue-grey" /></span>
            <p>Cargando datos...</p>
        </div>

        <div v-else-if="aprobarPreRegistro.error" class="text-center">
            <p>{{ aprobarPreRegistro.error }}</p>
            <q-btn label="Reintentar" @click="recargar" class="q-p-sm" />
        </div>

        <!-- Datos -->
        <div class="datos" v-else-if="aprobarPreRegistro.preRegistroAprobar" style="max-width: 90%; margin: 0 auto;">
            <q-separator class="q-my-md" />

            <div class="">
                <p class="text-subtitle1 text-primary q-mb-sm q-mt-none text-weight-bold">Información General</p>
                <div class="row q-col-gutter-md q-mb-md">
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.NIT" label="NIT"
                            dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.RazonSocial"
                            label="Razón Social" dense />
                    </div>
                </div>
                <div class="row q-col-gutter-md q-mb-md">
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.TipoProveedor"
                            label="Tipo de Proveedor" dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.TipoContribuyente"
                            label="Tipo de Contribuyente" dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.CorreoElectronico"
                            label="Correo Electrónico" dense type="email" />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.Telefono"
                            label="Teléfono" dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly
                            v-model="aprobarPreRegistro.preRegistroAprobar.data.DireccionNotificacion"
                            label="Dirección de Notificación" dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.Ciudad"
                            label="Ciudad" dense />
                    </div>
                    <div class="col-12 col-md-6">
                        <q-select filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.estadoProveedor"
                            :options="optionsEstado" label="Estado Actual" dense />
                    </div>
                </div>
            </div>

            <q-separator class="q-my-md" />

            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Representante Legal</p>
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-6">
                    <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.NombreRepresentante"
                        label="Nombre Representante Legal" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.NumeroIdentificacion"
                        label="No. Identificación Representante Legal" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.TipoDocumentoRepresentante"
                        label="Tipo de Documento Representante Legal" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly v-model="aprobarPreRegistro.preRegistroAprobar.data.TelefonoRepresentante"
                        label="Teléfono Representante Legal" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.CorreoElectronicoRepresentante"
                        label="Correo Electrónico Representante Legal" dense type="email" />
                </div>
            </div>

            <q-separator class="q-my-md" />

            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Representante Comercial</p>
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.NombreRepresentanteComercial"
                        label="Nombre Completo" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.CargoRepresentanteComercial" label="Cargo"
                        dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.TelefonoRepresentanteComercial"
                        label="Teléfono" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.CorreoElectronicoRepresentanteComercial"
                        label="Correo Electrónico" dense type="email" />
                </div>
            </div>

            <q-separator class="q-my-md" />

            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Responsable de Facturación</p>
            <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.NombresApellidosResponsable"
                        label="Nombre Completo" dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.CargoResponsableFacturacion" label="Cargo"
                        dense />
                </div>
                <div class="col-12 col-md-6">
                    <q-input filled readonly
                        v-model="aprobarPreRegistro.preRegistroAprobar.data.CorreoElectronicoResponsable"
                        label="Correo Electrónico" dense type="email" />
                </div>
            </div>

            <q-separator class="q-my-md" />

            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Documentos Adjuntos</p>
            <q-list bordered separator class="rounded-borders bg-white">
                <q-item v-if="!aprobarPreRegistro.preRegistroAprobar.data.Documentos || aprobarPreRegistro.preRegistroAprobar.data.Documentos.length === 0">
                    <q-item-section class="text-grey-6 text-center">
                        No hay documentos cargados.
                    </q-item-section>
                </q-item>

                <q-item v-for="(doc, index) in (aprobarPreRegistro.preRegistroAprobar.data.Documentos || [])" :key="index">
                    <q-item-section avatar>
                        <q-icon :name="getIconDocumento(doc.nombre, doc.formato, doc.url)"
                            :color="getColorDocumento(doc.tipo)" size="28px" />
                    </q-item-section>

                    <q-item-section>
                        <q-item-label class="text-weight-bold">{{ doc.tipo }}</q-item-label>
                        <q-item-label caption>{{ doc.nombre }}</q-item-label>
                    </q-item-section>

                    <q-item-section side>
                        <div class="row q-gutter-xs">
                            <q-btn flat round dense icon="visibility" color="primary" @click="abrirDocumento(doc.url)">
                                <q-tooltip>Ver</q-tooltip>
                            </q-btn>
                            <q-btn flat round dense icon="download" color="secondary"
                                @click="descargarDocumento(doc.url, doc.nombre)">
                                <q-tooltip>Descargar</q-tooltip>
                            </q-btn>
                        </div>
                    </q-item-section>

                    <q-option-group
                        v-model="evaluaciones[index]"
                        type="radio"
                        inline
                        :options="[
                            { label: 'Bien', value: 'bien' },
                            { label: 'Mal', value: 'mal' }
                        ]"
                    />
                </q-item>
            </q-list>

            <q-separator class="q-my-md" />

            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Comentarios</p>
            <div>
                <q-input 
                    v-model="comentario"
                    label="Si tienes algún comentario hacía el proveedor puedes dejarlo aquí..." 
                />
            </div>

            <q-separator class="q-my-md" />

            <div class="q-mb-md" style="display: flex; justify-content: space-evenly;">
                <q-btn label="Aprobar" color="positive" @click="procesarAprobacion" class="q-mr-sm" />
                <q-btn label="Rechazar" color="negative" @click="rechazarProveedor" />
            </div>

        </div>
    </div>
</template>