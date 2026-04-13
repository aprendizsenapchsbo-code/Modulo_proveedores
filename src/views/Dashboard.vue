<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/usuario';
import { useProveedorStore } from '../stores/proveedor.js';
import axios from 'axios';
import { exitoNotify, errorNotify } from '../composables/Notify';

const router = useRouter()
const usuarioStore = useUsuarioStore()
const proveedorStore = useProveedorStore()

const CorreoElectronico = ref('');

const totalProveedores = ref(0);
const totalProveedoresPendientes = ref(0);
const cumplimiientoGeneral = ref(0);


// Refs para editar
/* const nitEdit = ref('');
const dvEdit = ref('');
const razonSocialEdit = ref('');
const correoEdit = ref('');
const direccionNotificacionEdit = ref('');
const telefonoEdit = ref('');
const ciudadEdit = ref('');
const nombreRepresentanteEdit = ref('');
const tipoDocumentoRepresentanteEdit = ref('');
const numeroIdentificacionEdit = ref('');
const telefonoRepresentanteEdit = ref('');
const correoElectronicoRepresentanteEdit = ref('');
const nombreRepresentanteComercialEdit = ref('');
const cargoRepresentanteComercialEdit = ref('');
const telefonoRepresentanteComercialEdit = ref('');
const correoElectronicoRepresentanteComercialEdit = ref('');
const nombresApellidosResponsableEdit = ref('');
const correoElectronicoResponsableEdit = ref('');
const tipoContribuyenteEdit = ref('');
const tipoProveedorEdit = ref('');
const documentosEdit = ref([]);

const estadoEdit = ref('');
const proveedorEditando = ref(null); */

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

const modelTipo = ref(null)
const modelEstado = ref(null)
const text = ref(null)
const optionsTipo = [
    'Servicio', 'Bien', 'Servicio/Bien'
]
const optionsEstado = [
    'Pre-registro', 'Registrado', 'Actualizado', 'Pendiente Actualización', 'Inactivo'
]

function logout() {
    usuarioStore.clearUsuario();
    usuarioStore.clearToken();
    router.push('/')

    console.log("Sesión cerrada");

}

const persistent = ref(false);
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

// Función para abrir el modal de edición con datos precargados
function abrirModalEditar(proveedor) {
    /* proveedorEditando.value = proveedor;
    nitEdit.value = proveedor.NIT;
    dvEdit.value = proveedor.DV;
    razonSocialEdit.value = proveedor.RazonSocial;
    correoEdit.value = proveedor.CorreoElectronico;
    direccionNotificacionEdit.value = proveedor.DireccionNotificacion;
    telefonoEdit.value = proveedor.Telefono;
    ciudadEdit.value = proveedor.Ciudad;
    nombreRepresentanteEdit.value = proveedor.NombreRepresentante;
    tipoDocumentoRepresentanteEdit = proveedor.TipoDocumentoRepresentante;
    numeroIdentificacionEdit.value = proveedor.NumeroIdentificacion;
    telefonoRepresentanteEdit.value = proveedor.TelefonoRepresentante;
    correoElectronicoRepresentanteEdit.value = proveedor.CorreoElectronicoRepresentante;
    nombreRepresentanteComercialEdit.value = proveedor.NombreRepresentanteComercial;
    cargoRepresentanteComercialEdit.value = proveedor.CargoRepresentanteComercial;
    telefonoRepresentanteComercialEdit.value = proveedor.TelefonoRepresentanteComercial;
    correoElectronicoRepresentanteComercialEdit.value = proveedor.CorreoElectronicoRepresentanteComercial;
    nombresApellidosResponsableEdit.value = proveedor.NombresApellidosResponsable;
    correoElectronicoResponsableEdit.value = proveedor.CorreoElectronicoResponsable;
    tipoContribuyenteEdit.value = proveedor.TipoContribuyente;
    tipoProveedorEdit.value = proveedor.TipoProveedor;
    documentosEdit.value = proveedor.Documentos;
    estadoEdit.value = proveedor.estadoProveedor;
    persistentEdit.value = true; */

    formDataEdit.value = {...proveedor};
    persistentEdit.value = true;
}

// funcion para enviar el correo de invitación
const loading = ref(false)

async function enviarInvitacion() {
    loading.value = true
    try {

        const respuesta = await axios.post('https://modulo-proveedores-backend.vercel.app/api/proveedor/registro', {
            CorreoElectronico: CorreoElectronico.value
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

        exitoNotify(`¡Solicitud enviada a ${CorreoElectronico.value}. Link válido por 5 días!`);

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
        sortable: true
    },
    {
        name: 'RazonSocial',
        align: 'center',
        label: 'Razón Social',
        field: 'RazonSocial',
        sortable: true
    },
    /* { 
      name: 'DireccionNotificacion', 
      label: 'Dirección de notificación', 
      field: 'DireccionNotificacion', 
      sortable: true 
    }, */
    { 
      name: 'Telefono', 
      label: 'Teléfono', 
      field: 'Telefono'
    },
    { 
      name: 'Ciudad', 
      label: 'Ciudad', 
      field: 'Ciudad' 
    },
    {
        name: 'CorreoElectronico',
        label: 'Correo Electrónico',
        field: 'CorreoElectronico'
    },
    /*   {
        name: 'NombreRepresentante',
        label: 'Nombre del Representante',
        field: 'NombreRepresentante',
        sortable: true
      },
      {
        name: 'NumeroIdentificacion',
        label: 'Número de Identificación',
        field: 'NumeroIdentificacion',
        sortable: true,
      },
      {
        name: 'TelefonoRepresentante',
        label: 'Teléfono del Representante',
        field: 'TelefonoRepresentante',
        sortable: true,
      },
      {
        name: 'CorreoElectronicoRepresentante',
        label: 'Correo Electrónico del Representante',
        field: 'CorreoElectronicoRepresentante',
        sortable: true,
      },
      {
        name: 'NombresApellidosResponsable',
        label: 'Nombres y Apellidos del Responsable',
        field: 'NombresApellidosResponsable',
        sortable: true,
      },
      {
        name: 'CorreoElectronicoResponsable',
        label: 'Correo Electrónico del Responsable',
        field: 'CorreoElectronicoResponsable',
        sortable: true,
      },*/
    {
        name: 'estadoProveedor',
        label: 'Estado',
        field: 'estadoProveedor',
        sortable: true,
    },
    {
        name: 'Opciones',
        label: 'Opciones',
        field: 'Opciones',
    }
]

// FILAS
const rows = ref([]);

// Función para traer los proveedores desde la base de datos
async function obtenerProveedores() {
    loading.value = true;
    try {
        const response = await axios.get('https://modulo-proveedores-backend.vercel.app/api/proveedor', {
            /* headers: {
                Authorization: `Bearer ${proveedorStore.tokenRegistro}`
            } */
        });
        // const r = response.data
        console.log('Proveedores', response.data);
        
        totalProveedores.value = response.data.data.length;
        console.log(totalProveedores);

        totalProveedoresPendientes.value = response.data.data.filter(p => p.estadoProveedor === 'Pendiente Actualización').length;
        console.log(totalProveedoresPendientes);

        cumplimiientoGeneral.value = Math.round(((totalProveedores.value - totalProveedoresPendientes.value) / totalProveedores.value) * 100);
        console.log(cumplimiientoGeneral);

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
        console.log('Eliminando proveedor:', proveedor._id);
        await axios.delete(`https://modulo-proveedores-backend.vercel.app/api/proveedor/${proveedor._id}`);
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
    const proveedor = proveedorEditando.value;
    loading.value = true;
    try {
        console.log('ID proveedor:', proveedor._id);
        if (!proveedor._id) {
            errorNotify('ID del proveedor no encontrado. No se puede actualizar el registro.');
            return;
        }

        const { _id, ...datosParaActualizar } = formDataEdit.value;

        
        const r = await axios.put(`https://modulo-proveedores-backend.vercel.app/api/proveedor/${_id}`, datosParaActualizar);
            /*NIT: nitEdit.value,
            DV: dvEdit.value,
            RazonSocial: razonSocialEdit.value,
            CorreoElectronico: correoEdit.value,
            DireccionNotificacion: direccionNotificacionEdit.value,
            Telefono: telefonoEdit.value,
            Ciudad: ciudadEdit.value,
            NombreRepresentante: nombreRepresentanteEdit.value,
            TipoDocumentoRepresentante: tipoDocumentoRepresentanteEdit.value,
            NumeroIdentificacion: numeroIdentificacionEdit.value,
            TelefonoRepresentante: telefonoRepresentanteEdit.value,
            CorreoElectronicoRepresentante: correoElectronicoRepresentanteEdit.value,
            NombreRepresentanteComercial: nombreRepresentanteComercialEdit.value,
            CargoRepresentanteComercial: cargoRepresentanteComercialEdit.value,
            TelefonoRepresentanteComercial: telefonoRepresentanteComercialEdit.value,
            CorreoElectronicoRepresentanteComercial: correoElectronicoRepresentanteComercialEdit.value,
            NombresApellidosResponsable: nombresApellidosResponsableEdit.value,
            CorreoElectronicoResponsable: correoElectronicoResponsableEdit.value,
            TipoContribuyente: tipoContribuyenteEdit.value,
            TipoProveedor: tipoProveedorEdit.value,
            Documentos: documentosEdit.value,
            estadoProveedor: estadoEdit.value
        }, {
            /* headers: {
                Authorization: `Bearer ${proveedorStore.tokenRegistro}`
            }
        }); */
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
        console.log('Solicitando actualización para proveedor:', proveedor._id);
        await axios.put(`https://modulo-proveedores-backend.vercel.app/api/proveedor/${proveedor._id}/solicitar-actualizacion`);
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
                <div class="rol-admin">
                    <span class="bg-secondary text-white q-px-md q-py-sm rounded-borders">{{
                        usuarioStore.usuario?.nombre }} - {{ usuarioStore.usuario?.rol }} </span>
                </div>
                <div class="btn-logout">
                    <q-btn @click="logout" class="logout bg-clear" label="Cerrar sesión" />
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
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ totalProveedores }}</span>
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
                        <span class="porcentajeMensual" style="color: #F8C837;">Requiere atención inmediata</span>
                    </div>
                </div>
                <div class="box3 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">CUMPLIMIENTO GENERAL</span>
                        <div class="cuadritoAzul q-mr-md "
                            style="width: 25px; height: 20px; background-color: #6BBB6B; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ cumplimiientoGeneral }}%</span>
                        <span class="porcentajeMensual text-grey-5">Requiere atención inmediata</span>
                    </div>
                </div>
            </section>

            <section class="filtros q-mt-lg">
                <div class="inputBusqueda">
                    <q-input outlined v-model="text" label="🔍 Buscar proveedor" class="q-pl-md rounded-borders" />
                </div>

                <div class="filtroTipo">
                    <q-select class="selectTipo" outlined v-model="modelTipo" :options="optionsTipo" label="Tipo" />
                </div>

                <div class="filtroEstado">
                    <q-select class="selectEstado" outlined v-model="modelEstado" :options="optionsEstado"
                        label="Estado" />
                </div>

                <div class="btnRegistrarProveedor q-pr-lg">
                    <q-btn @click="persistent = true" class="bg-primary text-white "
                        label="Registrar nuevo proveedor" />


                </div>
            </section>

            <section class="tablaProveedores">
                <div class="q-pa-md">
                    <q-table title="Proveedores" :rows="rows" :columns="columns" row-key="id" :loading="loading">
                        <!-- Personalizar columna de Opciones -->
                        <template v-slot:body-cell-Opciones="props">
                            <q-td :props="props">
                                <q-btn flat icon="edit" color="primary" @click="abrirModalEditar(props.row)">
                                    <q-tooltip transition-show="scale" transition-hide="scale">
                                        Editar proveedor
                                    </q-tooltip>
                                </q-btn>
                                <q-btn flat icon="delete" color="negative" @click="eliminarProveedor(props.row)" />
                                <q-btn flat icon="email" color="warning"
                                    @click="solicitarActualizacionProveedor(props.row)">
                                    <q-tooltip transition-show="scale" transition-hide="scale">
                                        Solicitar actualización al proveedor
                                    </q-tooltip>
                                </q-btn>
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
                                    :options="['Ferretería', 'Materiales de Construcción', 'Servicios Generales', 'Suministros Industriales', 'Tecnología y Equipos', 'Diseño de obras civiles', 'Otro']" 
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

.contenidoHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 70px;
    background-color: white;
}

.contenidoHeader .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 95%;
    margin: 0px auto;
}

.contenido {
    margin: 0px auto;
    width: 95%;
}

.logout {
    color: #3454D1;
    border: 1px solid;
    border-radius: 12px;
    border-color: #3454D1;
}

.estadisticas {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
    gap: 50px;
    height: auto;
}

.estadisticas .box1 {
    display: grid;
    border-radius: 10px;
    box-shadow: 0px 0px 4px rgba($color: #000000, $alpha: 0.7);
    background-color: white;
}

.estadisticas .contenido1 {
    display: flex;
    justify-content: space-between;
}

.estadisticas .contenido2 {
    display: flex;
    flex-direction: column;
    padding: 25px 0px 15px 0px;
}

.estadisticas .box2 {
    display: grid;
    border-radius: 10px;
    box-shadow: 0px 0px 4px rgba($color: #000000, $alpha: 0.7);
    background-color: white;
}

.estadisticas .box3 {
    border-radius: 10px;
    box-shadow: 0px 0px 4px rgba($color: #000000, $alpha: 0.7);
    background-color: white;
}

.filtros {
    display: flex;
    gap: 30px;
    align-items: center;
    height: 100px;
    background-color: white;
    border-radius: 15px;
}

.filtros .inputBusqueda {
    width: 500px;
}

.filtros .filtroTipo {
    width: 150px;
}

.filtros .filtroTipo .selectTipo :deep(.q-field__control) {
    border-radius: 12px;
}

.filtros .filtroEstado {
    width: 150px;
}

.filtros .filtroEstado .selectEstado :deep(.q-field__control) {
    border-radius: 12px;
}

.filtros .btnRegistrarProveedor {
    margin-left: auto;
}

:deep(.q-item) {
    transition: background-color 0.2s ease;
    
    &:hover {
        background-color: #f5f5f5 !important;
    }
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
</style>