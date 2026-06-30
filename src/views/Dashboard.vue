<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/usuario';
import { useProveedorStore } from '../stores/proveedor.js';
import axios from 'axios';
import { exitoNotify, errorNotify } from '../composables/Notify';
import apiClient from '../services/axios.js';

import logo from '../assets/img/Logo_login.png';

const router = useRouter()
const usuarioStore = useUsuarioStore()
const proveedorStore = useProveedorStore()

const CorreoElectronico = ref('');

const totalProveedores = ref(0);
const totalProveedoresPendientes = ref(0);
const cumplimientoGeneral = ref(0);

const formDataView = ref({});
const formDataEdit = ref({});

onMounted(() => {
    console.log('Usuario en store:', usuarioStore.usuario);
    console.log('Rol:', usuarioStore.usuario?.rol);
    obtenerProveedores();
})

const emailRules = [
    val => (val && val.length > 0) || 'El campo email es obligatorio',
    val => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !val || pattern.test(val) || 'El formato del email no es válido'
    }
]

const modelTipo = ref(null);
const modelEstado = ref(null);
const textBusqueda = ref('');
const optionsTipo = [
    'Ferretería y materiales de construcción', 'EPP', 'Servicios generales', 'Suministros industriales', 'Tecnología', 'Diseño de obras civiles', 'Otro'
]
const optionsEstado = [
    'Pre-registro', 'Registrado', 'Actualizado', 'Pendiente Actualización', 'Inactivo'
]

function logout() {
    usuarioStore.clearAuth();
    router.push('/')

    console.log("Sesión cerrada");

}

const persistent = ref(false);
const persistentView = ref(false);
const persistentEdit = ref(false);

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

// Función para buscar proveedores 
const cumpleFiltroTexto = (proveedor, textoBusqueda) => {
    if (!textoBusqueda) return true;

    const texto = textoBusqueda.toLowerCase().trim();
    const nit = String(proveedor.NIT || '').toLowerCase();
    const razonSocial = String(proveedor.RazonSocial || '').toLowerCase();

    return nit.includes(texto) || razonSocial.includes(texto);
}

// Función para filtrar por tipo
const cumpleFiltroTipo = (proveedor, tipoSeleccionado) => {
    if (!tipoSeleccionado) return true;

    const tipoProveedorBD = String(proveedor.TipoProveedor || '').trim().toLowerCase();
    const tipoSelect = String(tipoSeleccionado).trim().toLowerCase();

    return tipoProveedorBD === tipoSelect;
}

// Función para filtrar por estado
const cumpleFiltroEstado = (proveedor, estadoSeleccionado) => {
    if (!estadoSeleccionado) return true;

    const estadoProveedorBD = String(proveedor.estadoProveedor || '').trim().toLowerCase();
    const estadoSelect = String(modelEstado.value).trim().toLowerCase();

    return estadoProveedorBD === estadoSelect;
}

const rowsFiltradas = computed(() => {
    // Obtenemos los valores actuales de los inputs
    const texto = textBusqueda.value;
    const tipo = modelTipo.value;
    const estado = modelEstado.value;

    return rows.value.filter(proveedor => {
        const pasaTexto = cumpleFiltroTexto(proveedor, texto);
        const pasaTipo = cumpleFiltroTipo(proveedor, tipo);
        const pasaEstado = cumpleFiltroEstado(proveedor, estado);

        return pasaTexto && pasaTipo && pasaEstado;
    });
});

// Función para filtrar por tipo

// Función para abrir el documento en una nueva pestaña
const abrirDocumento = async (url) => {
    // console.log('Documento a abrir:', documento.url)
    if (!url) {
        errorNotify('URL del documento no disponible')
        return;
    }

    try {
        const response = await fetch(url, {
            headers: {
                'x-token': usuarioStore.token
            }
        });
        
        if (!response.ok) throw new Error('Error al obtener el documento');
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');

        // Limpiar la URL después de un tiempo
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (error) {
        console.error(error)
        errorNotify('No se pudo abrir el documento');
    }
};

// Función para forzar la descarga del documento
const descargarDocumento = async (url, nombre) => {
    if (!url) {
        errorNotify('URL del documento no disponible')
        return;
    }
    try {
        const response = await fetch(url, {
            headers: {
                'x-token': usuarioStore.token
            }
        });
        if (!response.ok) throw new Error('Error al obtener el documento');

        const blob = await response.blob();
        const link = document.createElement('a');
        const blobUrl = URL.createObjectURL(blob);
        link.href = blobUrl;
        link.download = nombre || 'documento';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);

    } catch (error) {
        console.error(error)
        errorNotify('No se pudo descargar el documento');
    }
};

// Función abrir modal para visualizar la información del proveedor
function abrirModalVisualizar(proveedor) {
    formDataView.value = {...proveedor};
    persistentView.value = true;
}

// Función para abrir el modal de edición con datos precargados
function abrirModalEditar(proveedor) {
    formDataEdit.value = {...proveedor};
    persistentEdit.value = true;
}

// funcion para enviar el correo de invitación
const loading = ref(false)

async function enviarInvitacion() {
    loading.value = true
    try {

        const respuesta = await apiClient.post('api/proveedor/registro', {
            CorreoElectronico: CorreoElectronico.value
        }, {
            headers: {
                'x-token': ` ${usuarioStore.token} `
            }
        })

        console.log('Solicitud enviada:', respuesta.data);
        persistent.value = false

        const token = respuesta.data.token || respuesta.data.data?.token;
        if (!token) {
            console.error('Token no encontrado en la respuesta', respuesta.data);
            errorNotify('No se recibió token del servidor al enviar la invitación');
            return;
        }

        proveedorStore.setTokenRegistro(token);
        console.log('Token de registro guardado:', token);

        exitoNotify(`¡Solicitud enviada a ${CorreoElectronico.value}. Link válido por 7 días!`);
        obtenerProveedores();

    } catch (error) {
        console.error('Error al enviar la invitación:', error);
        errorNotify(error.response?.data?.msg || 'Error al enviar la invitación');
    } finally {
        loading.value = false
    }
} 

// Contenido de la tabla
// COLUMNAS
const columns = [
    {
        name: 'NIT',
        required: true,
        label: 'NIT',
        align: 'left',
        field: 'NIT',
        sortable: true,
        headerProps: { 'data-th': 'NIT' },
        props: { 'data-th': 'NIT' }
    },
    {
        name: 'RazonSocial',
        align: 'center',
        label: 'Razón Social',
        field: 'RazonSocial',
        sortable: true,
        headerProps: { 'data-th': 'RazonSocial' },
        props: { 'data-th': 'RazonSocial' }
    },
    { 
        name: 'DireccionNotificacion', 
        label: 'Dirección de notificación', 
        field: 'DireccionNotificacion', 
        sortable: true,
        headerProps: { 'data-th': 'DireccionNotificacion' },
        props: { 'data-th': 'DireccionNotificacion' }
    },
    { 
        name: 'Telefono', 
        label: 'Teléfono', 
        field: 'Telefono',
        headerProps: { 'data-th': 'Telefono' },
        props: { 'data-th': 'Telefono' }
    },
    { 
        name: 'Ciudad', 
        label: 'Ciudad', 
        field: 'Ciudad',
        headerProps: { 'data-th': 'Ciudad' },
        props: { 'data-th': 'Ciudad' }
    },
    {
        name: 'CorreoElectronico',
        label: 'Correo Electrónico',
        field: 'CorreoElectronico',
        headerProps: { 'data-th': 'CorreoElectronico' },
        props: { 'data-th': 'CorreoElectronico' }
    },
    {
        name: 'NombreRepresentante',
        label: 'Nombre Representante Legal',
        field: 'NombreRepresentante',
        sortable: true,
        headerProps: { 'data-th': 'NombreRepresentante' },
        props: { 'data-th': 'NombreRepresentante' }
      },
      {
        name: 'NumeroIdentificacion',
        label: 'Número Identificación Representante Legal',
        field: 'NumeroIdentificacion',
        sortable: true,
        headerProps: { 'data-th': 'NumeroIdentificacion' },
        props: { 'data-th': 'NumeroIdentificacion' }
      },
      {
        name: 'TelefonoRepresentante',
        label: 'Teléfono Representante Legal',
        field: 'TelefonoRepresentante',
        sortable: true,
        headerProps: { 'data-th': 'TelefonoRepresentante' },
        props: { 'data-th': 'TelefonoRepresentante' }
      },
      {
        name: 'CorreoElectronicoRepresentante',
        label: 'Correo Electrónico Representante Legal',
        field: 'CorreoElectronicoRepresentante',
        sortable: true,
        headerProps: { 'data-th': 'CorreoElectronicoRepresentante' },
        props: { 'data-th': 'CorreoElectronicoRepresentante' }
      },
      {
        name: 'NombresApellidosResponsable',
        label: 'Nombres Responsable de Facturación',
        field: 'NombresApellidosResponsable',
        sortable: true,
        headerProps: { 'data-th': 'NombresApellidosResponsable' },
        props: { 'data-th': 'NombresApellidosResponsable' }
      },
      {
        name: 'CorreoElectronicoResponsable',
        label: 'Correo Electrónico Responsable de Facturación',
        field: 'CorreoElectronicoResponsable',
        sortable: true,
        headerProps: { 'data-th': 'CorreoElectronicoResponsable' },
        props: { 'data-th': 'CorreoElectronicoResponsable' }
      },
    {
        name: 'estadoProveedor',
        label: 'Estado',
        field: 'estadoProveedor',
        sortable: true,
        align: 'center',
        headerProps: { 'data-th': 'estadoProveedor' },
        props: { 'data-th': 'estadoProveedor' }
    },
    {
        name: 'Opciones',
        label: 'Opciones',
        field: 'Opciones',
        align: 'center',
        style: 'min-width: 180px',
        headerProps: { 'data-th': 'Opciones' },
        props: { 'data-th': 'Opciones' }
    }
]

// FILAS
const rows = ref([]);

// Función para traer los proveedores desde la base de datos
async function obtenerProveedores() {
    loading.value = true;
    try {
        const response = await apiClient.get('api/proveedor');
        // const r = response.data
        console.log('Proveedores', response.data);
        
        totalProveedores.value = response.data.data.length;

        const pendientes = response.data.data.filter(p => p.estadoProveedor === 'Pendiente Actualización').length;
        totalProveedoresPendientes.value = pendientes;

        if (totalProveedores.value > 0) {
            cumplimientoGeneral.value = Math.round(((totalProveedores.value - pendientes) / totalProveedores.value) * 100);
        } else {
            cumplimientoGeneral.value = 0;
        }

        rows.value = response.data.data

    } catch (error) {
        console.error('Error al obtener proveedores:', error);
    } finally {
        loading.value = false;
    }
}


// Función para eliminar un proveedor
async function eliminarProveedor(proveedor) {
    // Aquí puedes agregar una confirmación con q-dialog
    if (!confirm('¿Estás seguro de que quieres eliminar este proveedor?')) return;

    loading.value = true;
    try {
        console.log('Eliminando proveedor:', proveedor.RazonSocial);
        await apiClient.delete(`api/proveedor/${proveedor.RazonSocial}`);
        exitoNotify('Proveedor eliminado exitosamente');
        obtenerProveedores(); // Recargar la lista
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        errorNotify(error.response?.data?.msg || 'Error al eliminar proveedor');
    } finally {
        loading.value = false;
    }
}

// función para editar un proveedor
async function editarProveedor() {
    // const proveedor = proveedorEditando.value;
    loading.value = true;
    try {
        console.log('Razón Social proveedor:', formDataEdit.value.RazonSocial);
        if (!formDataEdit.value.RazonSocial) {
        errorNotify('Error: No se encontró la razón social del proveedor');
        return;
    }

        const { RazonSocial, ...datosParaActualizar } = formDataEdit.value;

        
        const r = await apiClient.put(`api/proveedor/${RazonSocial}`, datosParaActualizar);
            
        console.log('Proveedor actualizado', r.data);
        exitoNotify('Proveedor actualizado exitosamente');
        persistentEdit.value = false;
        obtenerProveedores(); // Recargar la lista
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        errorNotify(error.response?.data?.msg || 'Error al actualizar proveedor');
    } finally {
        loading.value = false;
    }
}

// función para solicitar actualización al proveedor
async function solicitarActualizacionProveedor(proveedor) {
    loading.value = true;
    try {
        console.log('Solicitando actualización para proveedor:', proveedor.RazonSocial);
        await apiClient.put(`api/proveedor/${proveedor.RazonSocial}/solicitar-actualizacion`);
        exitoNotify('Solicitud de actualización enviada al proveedor');

        obtenerProveedores(); // Recargar la lista para reflejar cambios
    } catch (error) {
        console.error('Error al solicitar actualización:', error);
        errorNotify(error.response?.data?.msg || 'Error al solicitar actualización');
    } finally {
        loading.value = false;
    }
}
</script>

<template>
    <div class="pantallaProveedores">
        <section class="contenidoHeader">
            <div class="header">
                <div class="rol-admin" style="display: flex; align-items: center; gap: 10px;">
                    <div class="icono">
                        <img :src="logo" alt="Icono San Bartolomé" style="width: 100px; ">
                    </div>
                    <span class="bg-secondary text-white q-px-md q-py-sm rounded-borders text-no-wrap">{{
                        usuarioStore.usuario?.nombre }}
                        <span v-if="$q.screen.gt.xs"> - {{ usuarioStore.usuario?.rol }}</span>
                    </span>
                </div>
                <div class="btn-logout">
                    <q-btn @click="logout" class="logout " label="Cerrar sesión" />
                </div>
            </div>
        </section>

        <div class="contenido">
            <section class="estadisticas q-mt-lg">
                <div class="box1 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">TOTAL PROVEEDORES</span>
                        <div class="cuadritoAzul q-mr-md "
                            style="width: 25px; height: 20px; background-color: #D7E8FF; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ totalProveedores.toLocaleString('es-CO') }}</span>
                        <span class="porcentajeMensual text-primary">12% este mes</span>
                    </div>
                </div>
                <div class="box2 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">PENDIENTE DE ACTUALIZACION</span>
                        <div class="cuadritoAzul q-mr-md "
                            style="width: 25px; height: 20px; background-color: #FEE8A6; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ totalProveedoresPendientes }}</span>
                        <span class="porcentajeMensual text-grey-5" >Requiere atención inmediata</span>
                    </div>
                </div>
                <div class="box3 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">CUMPLIMIENTO GENERAL</span>
                        <div class="cuadritoAzul q-mr-md "
                            style="width: 25px; height: 20px; background-color: #6BBB6B; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ cumplimientoGeneral }}%</span>
                        <span class="porcentajeMensual text-grey-5">Requiere atención inmediata</span>
                    </div>
                </div>
            </section>

            <section class="filtros q-mt-lg">
                <div class="inputBusqueda">
                    <q-input 
                        outlined 
                        v-model="textBusqueda" 
                        label="🔍 Buscar proveedor" 
                        class="q-pl-md rounded-borders" 
                    />
                </div>

                <div class="filtroTipo">
                    <q-select 
                        class="selectTipo"
                        outlined 
                        v-model="modelTipo" 
                        :options="optionsTipo" 
                        label="Tipo" 
                        clearable
                    />
                </div>

                <div class="filtroEstado">
                    <q-select 
                        class="selectEstado" 
                        outlined 
                        v-model="modelEstado" 
                        :options="optionsEstado"
                        label="Estado" 
                        clearable
                    />
                </div>

                <div class="btnRegistrarProveedor q-pr-lg">
                    <q-btn @click="persistent = true" class="bg-primary text-white "
                        label="Registrar nuevo proveedor" />


                </div>
            </section>

            <section class="tablaProveedores">
                <div class="q-pa-md">
                    <q-table 
                        title="Proveedores" 
                        :rows="rowsFiltradas" 
                        :columns="columns" 
                        virtual-scroll
                        :virtual-scroll-sticky-size-start="48"
                        row-key="_id" 
                        :loading="loading"
                        rows-per-page-label="Registros por página"
                        no-data-label="No hay datos disponibles"
                        loading-label="Cargando..."
                    ">
                        <!-- Personalizar columna de Opciones -->
                        <template v-slot:body-cell-Opciones="props">
                            <q-td :props="props">
                                <!-- Botón para visualizar la información del proveedor -->
                                <div class="row no-wrap q-gutter-xs">
                                    <q-btn
                                       flat
                                       icon="visibility"
                                       color="accent"
                                       @click="abrirModalVisualizar(props.row)"
                                    >
                                       <q-tooltip transition-show="scale" transition-hide="scale">
                                           Visualizar información del proveedor
                                       </q-tooltip>
                                    </q-btn>
                                   <!-- Botón de editar -->
                                   <q-btn 
                                       flat 
                                       icon="edit" 
                                       color="primary" 
                                       @click="abrirModalEditar(props.row)"
                                   >
                                       <q-tooltip transition-show="scale" transition-hide="scale">
                                           Editar proveedor
                                       </q-tooltip>
                                   </q-btn>
                                   <!-- Botón de eliminar -->
                                   <q-btn 
                                       flat 
                                       icon="delete" 
                                       color="negative" 
                                       @click="eliminarProveedor(props.row)" 
                                   />
                                   <!-- Botón solicitar actualización -->
                                   <q-btn 
                                       flat 
                                       icon="email" 
                                       color="warning"
                                       @click="solicitarActualizacionProveedor(props.row)
                                   ">
                                       <q-tooltip transition-show="scale" transition-hide="scale">
                                           Solicitar actualización al proveedor
                                       </q-tooltip>
                                   </q-btn>
                                </div>
                            </q-td>
                        </template>
                    </q-table>
                </div>
            </section>

            <section class="dialogoRegistro">
                <q-dialog @submit.prevent="enviarInvitacion" v-model="persistent" persistent transition-show="scale"
                    transition-hide="scale" class="">
                    <q-card class=" text-white" style="width: 500px;">
                        <q-card-section class="bg-primary q-mb-md"
                            style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="text-h6">Invitar a proveedor a registrarse</div>
                            <q-card-actions align="right">
                                <q-btn flat label="X" v-close-popup />
                            </q-card-actions>
                        </q-card-section>

                        <q-form @submit.prevent="enviarInvitacion">
                            <q-card-section class="q-pt-none q-pb-xl">
                                <q-input class="q-mb-md bg-white input" v-model="CorreoElectronico" filled lazy-rules
                                    :rules="emailRules" type="CorreoElectronico" label="Email destino:" />
                            </q-card-section>

                            <q-card-section class="q-pa-none bg-grey-3"
                                style="display: flex; justify-content: flex-end; gap: 10px;">
                                <q-card-actions align="right">
                                    <q-btn class="bg-white text-black" flat label="Cancelar" v-close-popup />
                                </q-card-actions>
                                <q-card-actions align="right">
                                    <q-btn type="submit" :loading="loading" class="bg-primary text-white" flat
                                        label="Confirmar envio" />
                                </q-card-actions>
                            </q-card-section>
                        </q-form>
                    </q-card>
                </q-dialog>
            </section>

            <!-- SECCIÓN: MODAL DE VISUALIZACIÓN -->
            <section class="dialogoVisualizar">
                <q-dialog v-model="persistentView" persistent transition-show="scale" transition-hide="scale"
                :maximized="$q.screen.lt.md">
                    <q-card class="text-black" style="max-width: 800px; width: 100%;">
                        
                        <!-- Encabezado -->
                        <q-card-section class="bg-accent text-white row items-center justify-between">
                            <div class="text-h6">Detalles del Proveedor</div>
                            <q-btn flat round dense icon="close" v-close-popup color="white" />
                        </q-card-section>

                        <!-- Cuerpo con Scroll si es necesario -->
                        <q-card-section class="q-pa-md bg-grey-2" style="max-height: 70vh; overflow-y: auto;">
                            
                            <!-- SECCIÓN 1: INFORMACIÓN GENERAL -->
                            <p class="text-subtitle1 text-primary q-mb-sm q-mt-none text-weight-bold">Información General</p>
                            <div class="row q-col-gutter-md q-mb-md">
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.NIT" label="NIT" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.RazonSocial" label="Razón Social" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.TipoProveedor" label="Tipo de Proveedor" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.TipoContribuyente" label="Tipo de Contribuyente" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.CorreoElectronico" label="Correo Electrónico" dense type="email" />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.Telefono" label="Teléfono" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.DireccionNotificacion" label="Dirección de Notificación" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.Ciudad" label="Ciudad" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-select 
                                        filled 
                                        readonly 
                                        v-model="formDataView.estadoProveedor" 
                                        :options="optionsEstado" 
                                        label="Estado Actual" 
                                        dense
                                    />
                                </div>
                            </div>

                            <q-separator class="q-my-md" />

                            <!-- SECCIÓN 2: REPRESENTANTE LEGAL -->
                            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Representante Legal</p>
                            <div class="row q-col-gutter-md q-mb-md">
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.NombreRepresentante" label="Nombre Completo" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.NumeroIdentificacion" label="No. Identificación" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.TipoDocumentoRepresentante" label="Tipo de Documento" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.TelefonoRepresentante" label="Teléfono" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.CorreoElectronicoRepresentante" label="Correo Electrónico" dense type="email" />
                                </div>
                            </div>

                            <q-separator class="q-my-md" />

                            <!-- SECCIÓN 3: REPRESENTANTE COMERCIAL -->
                            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Representante Comercial</p>
                            <div class="row q-col-gutter-md q-mb-md">
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.NombreRepresentanteComercial" label="Nombre Completo" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.CargoRepresentanteComercial" label="Cargo" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.TelefonoRepresentanteComercial" label="Teléfono" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.CorreoElectronicoRepresentanteComercial" label="Correo Electrónico" dense type="email" />
                                </div>
                            </div>

                            <q-separator class="q-my-md" />

                            <!-- SECCIÓN 4: RESPONSABLE DE FACTURACION -->
                            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Responsable de Facturación</p>
                            <div class="row q-col-gutter-md q-mb-md">
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.NombresApellidosResponsable" label="Nombre Completo" dense />
                                </div>
                                <div class="col-12 col-md-6">
                                    <q-input filled readonly v-model="formDataView.CorreoElectronicoResponsable" label="Correo Electrónico" dense type="email" />
                                </div>
                            </div>

                            <q-separator class="q-my-md" />

                            <!-- SECCIÓN 5: DOCUMENTOS -->
                            <p class="text-subtitle1 text-primary q-mb-sm text-weight-bold">Documentos Adjuntos</p>
                            
                            <q-list bordered separator class="rounded-borders bg-white">
                                <q-item v-if="!formDataView.Documentos || formDataView.Documentos.length === 0">
                                    <q-item-section class="text-grey-6 text-center">
                                        No hay documentos cargados.
                                    </q-item-section>
                                </q-item>

                                <q-item v-for="(documento, index) in (formDataView.Documentos || [])" :key="index">
                                    <q-item-section avatar>
                                        <q-icon 
                                            :name="getIconDocumento(documento.nombre, documento.formato, documento.url)" 
                                            :color="getColorDocumento(documento.tipo)" 
                                            size="28px" 
                                        />
                                    </q-item-section>
                                    
                                    <q-item-section>
                                        <q-item-label class="text-weight-bold">{{ documento.tipo }}</q-item-label>
                                        <q-item-label caption>{{ documento.nombre }}</q-item-label>
                                    </q-item-section>

                                    <q-item-section side>
                                        <div class="row q-gutter-xs">
                                            <q-btn 
                                                flat 
                                                round 
                                                dense 
                                                icon="visibility" 
                                                color="primary" 
                                                @click="abrirDocumento(documento.url)"
                                            >
                                                <q-tooltip>Ver</q-tooltip>
                                            </q-btn>
                                            <q-btn 
                                                flat 
                                                round 
                                                dense 
                                                icon="download" 
                                                color="secondary" 
                                                @click="descargarDocumento(documento.url, documento.nombre)"
                                            >
                                                <q-tooltip>Descargar</q-tooltip>
                                            </q-btn>
                                        </div>
                                    </q-item-section>
                                </q-item>
                            </q-list>

                        </q-card-section>

                        <!-- Pie del Modal -->
                        <q-card-actions align="right" class="bg-grey-3">
                            <q-btn label="Cerrar" color="primary" v-close-popup unelevated />
                        </q-card-actions>
                    </q-card>
                </q-dialog>
            </section>

            <!-- SECCIÓN: MODAL DE ACTUALIZACION -->
            <section class="dialogoActualizar">
                <q-dialog v-model="persistentEdit" persistent transition-show="scale" transition-hide="scale">
                    <q-card class="text-white" style="width: 600px;">
                        <q-card-section class="bg-primary q-mb-md"
                            style="display: flex; justify-content: space-between; align-items: center;">
                            <div class="text-h6">Editar Proveedor</div>
                            <q-card-actions align="right">
                                <q-btn flat label="X" v-close-popup />
                            </q-card-actions>
                        </q-card-section>

                        <q-form @submit.prevent="editarProveedor">
                            <q-card-section class="q-pt-none q-pb-xl">
                                <p class="text-h5 text-secondary q-pb-md">Información General</p>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.NIT"
                                        label="Número de Identificación Tributaria (NIT)" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.RazonSocial" label="Razón Social" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.CorreoElectronico" label="Correo Electrónico" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.DireccionNotificacion" label="Dirección de Notificación" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.Telefono" label="Teléfono" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.Ciudad" label="Ciudad" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.NombreRepresentante" label="Nombre del Representante" />
                                </div>

                                <div class="q-mb-md">
                                    <q-select 
                                        filled 
                                        v-model="formDataEdit.TipoDocumentoRepresentante" 
                                        :options="['Cédula de Ciudadanía', 'Cédula de Extranjería', 'Pasaporte', 'Otro']" 
                                        label="Tipo de Documento del Representante" 
                                        emit-value
                                        map-options
                                    />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.NumeroIdentificacion" label="Número de Identificación" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.TelefonoRepresentante" label="Teléfono del Representante" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.CorreoElectronicoRepresentante" label="Correo Electrónico del Representante" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.NombreRepresentanteComercial" label="Nombres y Apellidos del Representante Comercial" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.CargoRepresentanteComercial" label="Cargo del Representante Comercial" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.TelefonoRepresentanteComercial" label="Teléfono del Representante Comercial" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.CorreoElectronicoRepresentanteComercial" label="Correo Electrónico del Representante Comercial" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.NombresApellidosResponsable" label="Nombres y Apellidos del Responsable" />
                                </div>

                                <div class="q-mb-md">
                                    <q-input filled v-model="formDataEdit.CorreoElectronicoResponsable" label="Correo Electrónico del Responsable" />
                                </div>

                                <div class="q-mb-md">
                                    <q-select 
                                    filled 
                                    v-model="formDataEdit.TipoContribuyente" 
                                    :options="['Persona Natural', 'Persona Jurídica']"
                                    label="Tipo de Contribuyente" />
                                </div>

                                <div class="q-mb-md">
                                    <q-select 
                                    filled 
                                    v-model="formDataEdit.TipoProveedor"
                                    :options="['Ferretería y materiales de construcción', 'EPP', 'Servicios generales', 'Suministros industriales', 'Tecnología', 'Diseño de obras civiles', 'Otro']" 
                                    label="Tipo de Proveedor" />
                                </div>

                                <div class="q-mb-md">
                                    <p class="text-subtitle2 text-secondary q-mb-sm">Documentos Cargados</p>

                                    <!-- Lista de documentos -->
                                    <q-list bordered separator class="rounded-borders bg-grey-1">
                                        <!-- Caso: No hay documentos -->
                                        <q-item v-if="!formDataEdit.Documentos || formDataEdit.Documentos.length === 0">
                                            <q-item-section>
                                                <q-item-label class="text-grey-7">Sin documentos cargados</q-item-label>
                                            </q-item-section>
                                        </q-item>

                                         <!-- Caso: Si hay documentos -->
                                        <q-item
                                            v-for="(doc, index) in formDataEdit.Documentos"
                                            :key="index"
                                            class="q-py-sm"
                                            >
                                            <!-- Icono según tipo de archivo -->
                                            <q-item-section avatar>
                                                <q-icon
                                                    :name="getIconDocumento(doc.nombre, doc.formato, doc.url)"
                                                    :color="getColorDocumento(doc.tipo)"
                                                    size="24px"
                                                />
                                            </q-item-section>

                                            <!-- Info del documento -->
                                            <q-item-section>
                                                <q-item-label class="text-weight-bold text-accent">{{ doc.tipo }}</q-item-label>
                                                <q-item-label caption class="text-grey-7">{{ doc.nombre }}</q-item-label>
                                            </q-item-section>

                                             <!-- Acciones: Ver/Descargar -->
                                            <q-item-section side>
                                                <q-btn-group flat>
                                                    <q-btn
                                                        flat
                                                        round
                                                        dense
                                                        icon="visibility"
                                                        color="primary"
                                                        @click="abrirDocumento(doc.url)"
                                                    >
                                                    <q-tooltip>Ver documento</q-tooltip>
                                                    </q-btn>
                                                    <q-btn
                                                        flat
                                                        round
                                                        dense
                                                        icon="download"
                                                        color="secondary"
                                                        @click="descargarDocumento(doc.url, doc.nombre)"
                                                    >
                                                    <q-tooltip>Descargar</q-tooltip>
                                                    </q-btn>
                                                </q-btn-group>
                                            </q-item-section>
                                        </q-item>

                                    </q-list>

                                    <!-- Nota informativa -->
                                    <p class="text-caption text-grey-6 q-mt-xs">
                                    💡 Para modificar documentos, contacta al proveedor para que actualice su registro.
                                    </p>
                                </div>

                                <div class="q-mb-md">
                                    <q-select filled v-model="formDataEdit.estadoProveedor" :options="optionsEstado" label="Estado" />
                                </div>
                            </q-card-section>

                            <q-card-section class="q-pa-none bg-grey-3"
                                style="display: flex; justify-content: flex-end; gap: 10px;">
                                <q-card-actions align="right">
                                    <q-btn class="bg-white text-black" flat label="Cancelar" v-close-popup />
                                </q-card-actions>
                                <q-card-actions align="right">
                                    <q-btn type="submit" :loading="loading" class="bg-primary text-white" flat
                                        label="Guardar Cambios" />
                                </q-card-actions>
                            </q-card-section>
                        </q-form>
                    </q-card>
                </q-dialog>
            </section>
        </div>
    </div>
</template>

<style scoped lang="scss">
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.pantallaProveedores {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f1f1f1;
}

/* HEADER */
.contenidoHeader {
    display: flex;
    align-items: center;
    min-height: 70px;
    background-color: white;
    padding: 10px 0;
}

.contenidoHeader .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 95%;
    margin: 0px auto;
    gap: 10px;
    flex-wrap: wrap;
}

.rol-admin {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.rol-admin img {
    max-width: 80px;
}

.contenido {
    margin: 0px auto;
    width: 95%;
}

.logout {
    color: #0a2833;
    border: 1px solid #6BBB6B;
    border-radius: 12px;
    white-space: nowrap;
}

.estadisticas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.estadisticas .box1,
.estadisticas .box2,
.estadisticas .box3 {
    display: grid;
    border-radius: 10px;
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.7);
    background-color: white;
    padding: 15px;
}

.estadisticas .contenido1 {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.estadisticas .contenido2 {
    display: flex;
    flex-direction: column;
    padding: 15px 0px 10px 0px;
}

/* FILTROS */
.filtros {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
    min-height: auto;
    background-color: white;
    border-radius: 15px;
    margin-top: 20px;
}

.filtros .inputBusqueda {
    flex: 1 1 300px;
    min-width: 200px;
}

.filtros .filtroTipo,
.filtros .filtroEstado {
    flex: 1 1 100px;
    min-width: 140px;
}

.filtros .filtroTipo :deep(.q-field__control),
.filtros .filtroEstado :deep(.q-field__control) {
    border-radius: 12px;
}

.filtros .btnRegistrarProveedor {
    margin-left: auto;
    flex: 0 0 auto;
    width: 100%;
}

@media (min-width: 768px) {
    .filtros .btnRegistrarProveedor {
        width: auto;
    }
}

/* TABLA */
.tablaProveedores {
    margin-top: 20px;
    background-color: white;
    border-radius: 10px;
    overflow: hidden;
}

:deep(.q-table) {
    overflow-x: auto;
}

:deep(.q-table__middle) {
    min-width: 800px; //Ancho minimo para que no se aplasten las columnas
}

// Ocultar columnas menos importantes en móvil
@media (max-width: 768px) {
    :deep(.q-table) {
        th[data-th="DireccionNotificacion"],
        td[data-th="DireccionNotificacion"],
        th[data-th="Telefono"],
        td[data-th="Telefono"],
        th[data-th="CorreoElectronico"],
        td[data-th="CorreoElectronico"],
        th[data-th="TelefonoRepresentante"],
        td[data-th="TelefonoRepresentante"],
        th[data-th="CorreoElectronicoRepresentante"],
        td[data-th="CorreoElectronicoRepresentante"],
        th[data-th="CorreoElectronicoResponsable"],
        td[data-th="CorreoElectronicoResponsable"] {
            display: none;
        }
    }
}

// MODALES
:deep(.q-dialog__inner) {
    max-width: 95vw !important;
    width: auto !important;
}

@media (max-width: 600px) {
    :deep(.q-dialog__inner > .q-card) {
        width: 100vw !important;
        max-width: 100vw !important;
        max-height: 100vh !important;
        border-radius: 0 !important;
    }
}

// ITEMS Y LISTAS
:deep(.q-item) {
    transition: background-color 0.2s ease;
}

:deep(.q-item:hover) {
    background-color: #f5f5f5 !important;
}

:deep(.q-item__section--avatar) {
    min-width: 40px;
}

:deep(.q-item__label--caption) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

// BREAKPOINTS ADICIONALES
@media (max-width: 1024px) {
    .estadisticas {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
}

// Móvil pequeño
@media (max-width: 480px) {
    .estadisticas {
        grid-template-columns: 1fr;
        gap: 15px;
    }

    .filtros {
        flex-direction: column;
        align-items: stretch;
    }

    .filtros .inputBusqueda,
    .filtros .filtroEstado,
    .filtros .filtroTipo,
    .filtros .btnRegistrarProveedor {
        width: 100%;
        flex: 1 1 100%;
    }

    .rol-admin span {
        font-size: 0.85rem;
    }
}
</style>