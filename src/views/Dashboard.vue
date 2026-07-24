<script setup>
// 1. IMPORTS
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/usuario';
import { useProveedorStore } from '../stores/proveedor.js';
import { useAprobarPreRegistroStore } from '../stores/aprobarPreRegistro.js';
import { useConfirm } from '../composables/useConfirm.js';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import { exitoNotify, errorNotify } from '../composables/Notify';
import { useProveedoresPaginados } from '../composables/useProveedorPaginado.js';
import apiClient from '../services/axios.js';
import logo from '../assets/img/Logo_login.png';

// 2. INSTANCIAS
const $q = useQuasar()
const router = useRouter()
const usuarioStore = useUsuarioStore()
const proveedorStore = useProveedorStore()
const aprobacionPreRegistroStore = useAprobarPreRegistroStore()
const { confirmar, confirmOpen, confirmOptions, handleResolve } = useConfirm()

// 3. ESTADO REACTIVO
// Formulario de creación de usuario
const nombreUsuario = ref('');
const correoUsuario = ref('');
const passwordUsuario = ref('');
const rolUsuario = ref(null);
const loadingCrearUsuario = ref(false);
const creadoConExito = ref(false);  // Controla el paso de "éxito" dentro del modal
const rolChipColor = (rol) => rol === 'admin' ? '#3454D1' : '#6FC33D';

// Formulario de invitación
const CorreoElectronico = ref('');
const ccEmail = ref('');

// RESUMEN / estadísticas
const resumen = ref({
    total: 0,
    preRegistro: { count: 0, lista: [] },
    pendientesActualizacion: 0
});
const cargandoResumen = ref(false);

// Modales
const persistentUsuario = ref(false);
const persistent = ref(false);
const persistentView = ref(false);
const persistentEdit = ref(false);
const modalDesdeNotificacion = ref(false);
const loadingInvitacion = ref(false);
const loadingEdicion = ref(false);

// Datos de los modales
const formDataView = ref({});
const formDataEdit = ref({});
const nuevosDocumentosEdit = ref([]);

// Filtros / búsqueda
const modelTipo = ref(null);
const modelEstado = ref(null);
const textBusqueda = ref('');
const resultadosBusqueda = ref([]);
const buscando = ref(false);

// 4. DATOS ESTATICOS
const passwordRules = [
    val => !!val || 'El campo contraseña es obligatorio',
    val => val.length >= 6 || 'La contraseña debe tener al menos 6 caracteres'
];
const rolRules = [
    val => !!val || 'El campo rol es obligatorio'
];

const emailRules = [
    val => (val && val.length > 0) || 'El campo email es obligatorio',
    val => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !val || pattern.test(val) || 'El formato del email no es válido'
    }
];

const optionsRol = [
    { label: 'Usuario', value: 'usuario' },
    { label: 'Administrador', value: 'admin' }
];

const optionsTipo = [
    'Ferretería y materiales de construcción', 'EPP', 'Servicios generales', 'Suministros industriales', 'Tecnología', 'Diseño de obras civiles', 'Otro'
];

const optionsEstado = [
    'Invitación_enviada', 'Pre-registro', 'Registrado', 'Actualizado', 'Pendiente Actualización', 'Inactivo'
];

// 5. COLUMNAS DE LA TABLA
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
        name: 'estadoEnlace',
        label: 'Estado Enlace',
        field: row => {
            if (row.estado === 'Invitación_enviada') return 'Pendiente';
            if (row.estado === 'Invitación_usada') return 'Completado';
            return '-';
        },
        sortable: true,
        align: 'center',
        style: 'min-width: 120px'
    },
    {
        name: 'estadoProveedor',
        label: 'Estado Proveedor',
        field: 'estadoProveedor',
        sortable: true,
        align: 'center',
        style: 'min-width: 150px',
        headerProps: { 'data-th': 'estadoProveedor' },
        props: { 'data-th': 'estadoProveedor' }
    },
    {
        name: 'Opciones',
        label: 'Opciones',
        field: 'Opciones',
        align: 'center',
        style: 'min-width: 200px; position: sticky; right: 0; z-index: 2; background-color: white;',
        classes: 'celda-opciones',
        headerStyle: 'position: sticky; right: 0; z-index: 3; background-color: #fafafa;',
        headerProps: { 'data-th': 'Opciones' },
        props: { 'data-th': 'Opciones' }
    }
];

// 6. COMPOSABLE DE PAGINA
// Inicializar el composable
const {
    proveedores: proveedoresPaginados,
    loading: loadingPaginado,
    hasMore,
    nextSkipToken,
    cargarPagina,
    cargarSiguiente,
    recargar,
    reset,
} = useProveedoresPaginados(10);

// 7. COMPUTED (derivaciones del estado)
// Búsqueda / tabla

const modoBusqueda = computed(() => {
    return textBusqueda.value.trim() !== '' || modelTipo.value || modelEstado.value;
});

// Computed para la tabla: muestra resultados de búsqueda o lista paginada normal
const proveedorVisibles = computed(() => {
    if (modoBusqueda.value) {
        return resultadosBusqueda.value;
    }
    // Sin filtros: mostramos los proveedores cargados por paginación
    return proveedoresPaginados.value;
});

// Ajuste: el loading de la tabla debe reflejar tanto la paginación como la búsqueda
const loadingTabla = computed(() => {
    return modoBusqueda.value ? buscando.value : loadingPaginado.value;
});

// Columnas visibles
const columnasVisibles = computed(() => {
    // Móvil pequeño:
    if ($q.screen.xs) {
        return ['NIT', 'RazonSocial', 'estadoProveedor', 'Opciones'];
    }

    // Móvil grande / tablet chica
    if ($q.screen.sm) {
        return ['NIT', 'RazonSocial', 'Ciudad', 'estadoProveedor', 'Opciones'];
    }

    // Tablet / laptop chica
    if ($q.screen.md) {
        return [
            'NIT',
            'RazonSocial',
            'Ciudad',
            'CorreoElectronico',
            'estadoEnlace',
            'estadoProveedor',
            'Opciones'
        ];
    }

    // Escritorio: todas
    return columns.map(c => c.name)
})

// Resumen / notificaciones
const notificaciones = computed(() => resumen.value.preRegistro.lista);
const totalNotificaciones = computed(() => resumen.value.preRegistro.count);
const totalProveedores = computed(() => resumen.value.total);
const totalProveedoresPendientes = computed(() => resumen.value.pendientesActualizacion);
const cumplimientoGeneral = computed(() => {
    const t = resumen.value.total;
    return t === 0 ? 0 : Math.round((( t - resumen.value.pendientesActualizacion ) / t) * 100);
});

// ¿El usuario logueado es administrador?
const esAdmin = computed(() => usuarioStore.usuario?.rol === 'admin');

// 8. HELPERS PUROS (sin efectos)
const formatearRazonSocial = (texto = '') => {
    const limpio = String(texto || '').trim().replace(/\s+/g, ' ');

    if (!limpio) return '';

    return limpio.charAt(0).toUpperCase() + limpio.slice(1).toLowerCase();
}

// Función auxiliar para determinar el color del estado
const getBadgeColor = (estado) => {
    const colores = {
        'Pre-registro': 'orange',
        'Registrado': 'green',
        'Actualizado': 'blue',
        'Pendiente Actualización': 'red',
        'Inactivo': 'grey'
    };
    return colores[estado] || 'grey';
}

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

// 9. ACCIONES SOBRE DOCUMENTOS
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

// 10. ACCIONES DE MODALES / NAVEGACION
function abrirModalVisualizar(proveedor, desdeNotificacion = false) {
    formDataView.value = {...proveedor};
    modalDesdeNotificacion.value = desdeNotificacion;
    persistentView.value = true;
}

// Función para abrir el modal de edición con datos precargados
function abrirModalEditar(proveedor) {
    formDataEdit.value = {...proveedor};
    persistentEdit.value = true;
}

// Función para la navegación de la aprobación del proveedor
function irAAprobarPreRegistro() {
    const prov = formDataView.value;

    // Cerrar el modal de visualización
    persistentView.value = false;

    // Cargar datos en el store
    aprobacionPreRegistroStore.setRazonSocialProveedor(prov.RazonSocial);

    // Navegar con el param
    const { href } = router.resolve({ 
        name: 'AprobarPreRegistro',
        params: { razonSocial: prov.RazonSocial }
    });

    window.open(href, '_blank', 'noopener,noreferrer');
}

function logout() {
    usuarioStore.clearAuth();
    router.push('/')
    console.log("Sesión cerrada");

}

// 11. ACCIONES DE NEGOCIO (API)
async function crearUsuario() {
    if (loadingCrearUsuario.value) return;  // evitar doble envío
    loadingCrearUsuario.value = true;
    try {
        const respuesta = await apiClient.post('api/usuario', {
            nombre: nombreUsuario.value,
            email: correoUsuario.value,
            rol: rolUsuario.value
        }, {
            headers: {
                'x-token': ` ${usuarioStore.token} `
            }
        })

        creadoConExito.value = true;

        // Limpiar campos del formulario
        nombreUsuario.value = '';
        correoUsuario.value = '';
        rolUsuario.value = null;

    } catch (error) {
        console.error('Error al crear el usuario:', error);
        errorNotify(error.response?.data?.msg || 'Error al crear el usuario');
    } finally {
        loadingCrearUsuario.value = false;
    }
}

async function enviarInvitacion() {
    if (!esAdmin.value) return errorNotify('No tienes permisos para esta acción');
    if (loadingInvitacion.value) return;  // evitar doble envío
    loadingInvitacion.value = true;
    try {
        const respuesta = await apiClient.post('api/proveedor/registro', {
            CorreoElectronico: CorreoElectronico.value,
            ccEmail: ccEmail.value.trim() || undefined  // solo envía si no está vacío
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

        exitoNotify(`¡Solicitud enviada a ${CorreoElectronico.value}. Link válido por 15 días!`);
        recargar();

    } catch (error) {
        console.error('Error al enviar la invitación:', error);
        errorNotify(error.response?.data?.msg || 'Error al enviar la invitación');
    } finally {
        loadingInvitacion.value = false;
    }
} 

// función para editar un proveedor
async function editarProveedor() {
    if (!esAdmin.value) return errorNotify('No tienes permisos para esta acción');
    if (loadingEdicion.value) return;  // evitar doble envío
    loadingEdicion.value = true;
    try {
        console.log('Razón Social proveedor:', formDataEdit.value.RazonSocial);
        if (!formDataEdit.value.RazonSocial) {
        errorNotify('Error: No se encontró la razón social del proveedor');
        return;
    }

    const { RazonSocial, Documentos, ...datosParaActualizar } = formDataEdit.value;
    
    /* Si hay archivos, usar FormData; si no, enviar JSON */
    if (nuevosDocumentosEdit.value && nuevosDocumentosEdit.value.length > 0) {
        const formData = new FormData();
        // Agregar los datos JSON como string
        formData.append('datosProveedor', JSON.stringify(datosParaActualizar));
        // Agregar cada archivo al campo 'documentos'
        nuevosDocumentosEdit.value.forEach((file) => {
            formData.append('documentos', file);
        });
        
        // Enviar información sobre los tipos de documentos si es necesario
        const tipos = nuevosDocumentosEdit.value.map((f, index) => ({
            index: index,
            tipo: 'Documento Adicional (Dashboard)'
        }));
        formData.append('tiposDocumentos', JSON.stringify(tipos));
        
        await apiClient.put(`api/proveedor/${RazonSocial}`, formData, 
        {
            headers: {
                'x-token': usuarioStore.token,
                'Content-Type': 'multipart/form-data'
            }
        } );
    } else {
        await apiClient.put(`api/proveedor/${RazonSocial}`, 
        datosParaActualizar,
        {
            headers: { 'x-token': usuarioStore.token }
        }
    );
}

exitoNotify('Proveedor actualizado exitosamente');
persistentEdit.value = false;
nuevosDocumentosEdit.value = [];
await recargar(); // Recargar la lista
} catch (error) {
    console.error('Error al actualizar proveedor:', error);
    errorNotify(error.response?.data?.msg || 'Error al actualizar proveedor');
} finally {
    loadingEdicion.value = false;
}
}

// Función para cambiar el estado del proveedor a inactivo, sin tener que eliminarlo
async function inactivarProveedor(proveedor) {
    if (!esAdmin.value) return errorNotify('No tienes permisos para esta acción');
    const ok = await confirmar({
        title: 'Inactivar proveedor',
        message: 'Esta acción marcará al proveedor como inactivo y dejará de aparecer como activo en el sistema.',
        subject: proveedor.RazonSocial,
        hint: 'Podrás reactivarlo más adelante desde la edición del proveedor.',
        confirmLabel: 'Sí, inactivar',
        cancelLabel: 'Cancelar',
        icon: 'person_off',
        confirmIcon: 'block',
        tone: 'danger'
    })
    if (!ok) return

    $q.loading.show({ message: 'Inactivando proveedor...', spinnerColor: 'white' });
    try {
        console.log('Actualizando estado del proveedor:', proveedor.RazonSocial);
        await apiClient.put(`/api/proveedor/inactivar-proveedor/${proveedor.RazonSocial}`);
        exitoNotify('Estado del proveedor actualizado a Inactivo')
        recargar();
    } catch (error) {
        console.error('Error al actualizar el estado del proveedor:', error);
        errorNotify(error.response?.data?.msg || 'Error al actualizar el estado del proveedor');
    } finally {
        $q.loading.hide();
    }
}

// función para solicitar actualización al proveedor
async function solicitarActualizacionProveedor(proveedor) {
    if (!esAdmin.value) return errorNotify('No tienes permisos para esta acción');

    const ok = await confirmar({
        title: 'Solicitar actualización',
        message: 'Se enviará un correo al proveedor para que actualice sus datos y documentos.',
        subject: proveedor.RazonSocial,
        confirmLabel: 'Enviar solicitud',
        cancelLabel: 'Cancelar',
        icon: 'email',
        confirmIcon: 'send',
        tone: 'warning'
    });
    if (!ok) return;

    try {
        console.log('Solicitando actualización para proveedor:', proveedor.RazonSocial);
        await apiClient.put(`api/proveedor/${proveedor.RazonSocial}/solicitar-actualizacion`);
        exitoNotify('Solicitud de actualización enviada al proveedor');

        recargar(); // Recargar la lista para reflejar cambios
    } catch (error) {
        console.error('Error al solicitar actualización:', error);
        errorNotify(error.response?.data?.msg || 'Error al solicitar actualización');
    }
}

// Búsqueda remota con debounce
// Función para ejecutar búsqueda en el backend
async function ejecutarBusqueda() {
    if (!modoBusqueda.value) return;  // Seguridad
    buscando.value = true;
    try {
        const params = {};
        if (textBusqueda.value.trim()) params.search = textBusqueda.value.trim();
        if (modelEstado.value) params.estadoProveedor = modelEstado.value;
        if (modelTipo.value) params.tipoProveedor = modelTipo.value;

        const { data } = await apiClient.get('api/proveedor/buscar', { params });
        if (data.success) {
            resultadosBusqueda.value = data.data;
        } else {
            errorNotify('Error en la búsqueda');
        }
    } catch (error) {
        console.error('Error al buscar proveedores:', error);
        errorNotify('Error al buscar proveedores');
    } finally {
        buscando.value = false;
    }
}

// 12. RESUMEN + POLLING
async function cargarResumen() {
    if (cargandoResumen.value) return;
    cargandoResumen.value = true;
    try {
        const { data } = await apiClient.get('api/proveedor/resumen');
        if (data.success) {
            resumen.value = {
                total: data.total ?? 0,
                preRegistro: data.preRegistro ?? { count: 0, lista: [] },
                pendientesActualizacion: data.pendientesActualizacion ?? 0
            };
        }
    } catch (e) {
        console.error('Error al cargar resumen:', e);
    } finally {
        cargandoResumen.value = false;
    }
}

// Polling cada 60s + pausa con la pestaña oculta
let intervaloResumen = null;
const iniciarPolling = () => {
    detenerPolling();  // evitar intervalos duplicados
    intervaloResumen = setInterval(cargarResumen, 60000);
}

const detenerPolling = () => {
    if (intervaloResumen) {
        clearInterval(intervaloResumen);
        intervaloResumen = null;
    }
}

const manejarVisibilidad = () => {
    if (document.hidden) {
        detenerPolling();  // no gastar recursos si no miran la pestaña
    } else {
        cargarResumen();  // refrescar al volver
        iniciarPolling();
    }
}

// 13. WATCHERS
// Watchers para disparar búsqueda automáticamente
let timeoutBusqueda;
function dispararBusqueda() {
    clearTimeout(timeoutBusqueda);
    timeoutBusqueda = setTimeout(() => {
        if (modoBusqueda.value) {
            ejecutarBusqueda();
        } else {
            // Si se limpiaron los filtros, volvemos a la paginación normal
            resultadosBusqueda.value = [];
            // Reiniciar paginación
            reset();
            cargarPagina();
        }
    }, 400);
}

// Observar los cambios en los filtros
watch([textBusqueda, modelTipo, modelEstado], () => {
    dispararBusqueda();
});

// 14. CICLO DE VIDA

onMounted(() => {
    console.log('Usuario en store:', usuarioStore.usuario);
    console.log('Rol:', usuarioStore.usuario?.rol);
    cargarPagina();

    // Notificaciones: primera carga + polling + control de visibilidad
    cargarResumen();
    iniciarPolling();
    document.addEventListener('visibilitychange', manejarVisibilidad);
});

onUnmounted(() => {
    detenerPolling();
    document.removeEventListener('visibilitychange', manejarVisibilidad);
});

</script>

<template>
    <div class="pantallaProveedores">
        <section class="contenidoHeader">
            <div class="header">
                <div class="rol-admin" style="display: flex; align-items: center; gap: 10px;">
                    <div class="icono">
                        <img :src="logo" alt="Icono San Bartolomé" style="width: 200px; ">
                    </div>
                    <span class="chip-usuario q-px-md q-py-sm rounded-borders text-no-wrap">{{
                        usuarioStore.usuario?.nombre }}
                        <span v-if="$q.screen.gt.xs"> - {{ usuarioStore.usuario?.rol }}</span>
                    </span>
                </div>
                <div class="btn-logout" style="display: flex; align-items: center; gap: 10px;">
                    <!-- Menú de administración -->
                    <q-btn-dropdown
                        v-if="usuarioStore.usuario?.rol === 'admin'"
                        flat
                        round
                        dende
                        icon="manage_accounts"
                        color="secondary"
                        class="btn-admin"
                        dropdown-icon="expand_more"
                    >
                        <q-list class="menu-admin">
                            <q-item-label header class="menu-admin__header">
                                Administración
                            </q-item-label>
                            <q-separator />

                            <q-item clickable v-close-popup @click="persistentUsuario = true" class="menu-admin__item">
                                <q-item-section avatar>
                                    <q-icon class="person_add" color="secondary" />
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label class="text-weight-medium">Crear usuario</q-item-label>
                                    <q-item-label caption>Dar de alta un nuevo acceso al sistema</q-item-label>
                                </q-item-section>
                            </q-item>

                            <!-- A futuro: gestionar / listar usuarios -->
                             <!-- 
                                <q-item clickable v-close-popup>
                                    <q-item-section avatar><q-icon name="group" color="primary" /></q-item-section>
                                    <q-item-section><q-item-label>Gestionar usuarios</q-item-label></q-item-section>
                                </q-item>
                             -->
                        </q-list>
                    </q-btn-dropdown>

                    <!-- Campana de notificaciones -->
                    <q-btn
                        v-if="esAdmin"
                        flat
                        round
                        dense
                        icon="notifications"
                        color="secondary"
                        class="btn-notificaciones"
                    >
                        <q-badge
                            v-if="totalNotificaciones > 0"
                            color="negative"
                            floating
                            :label="totalNotificaciones"
                        />

                        <q-menu>
                            <q-list style="min-width: 320px; max-width: 90vw;">
                                <q-item-label header class="header-notificaciones">
                                    Pre-registros por revisar ({{ totalNotificaciones }})
                                </q-item-label>
                                <q-separator />

                                <!-- Hay notificaciones -->
                                 <template v-if="notificaciones.length > 0">
                                    <q-item
                                        v-for="prov in notificaciones"
                                        :key="prov.NIT || prov.RazonSocial"
                                        clickable
                                        v-close-popup
                                        @click="abrirModalVisualizar(prov, true)"
                                    >
                                        <q-item-section avatar>
                                            <q-icon name="person_add_alt_1" color="secondary" />
                                        </q-item-section>
                                        <q-item-section>
                                            <q-item-label class="text-weight-medium">
                                                {{ prov.RazonSocial }}
                                            </q-item-label>
                                            <q-item-label caption>
                                               NIT: {{ prov.NIT }}
                                            </q-item-label>
                                        </q-item-section>
                                        <q-item-section side>
                                            <q-badge color="warning" label="Nuevo" />
                                        </q-item-section>
                                    </q-item>
                                 </template>

                                 <!-- Sin notificaciones -->
                                  <q-item v-else>
                                        <q-item-section class="text-grey-6 text-center q-pa-md">
                                            <q-icon name="check_circle" size="32px" color="positive" class="q-mb-sm" />
                                            No hay pre-registros pendientes
                                        </q-item-section>
                                  </q-item>
                            </q-list>
                        </q-menu>
                    </q-btn>

                    <q-btn @click="logout" class="logout " label="Cerrar sesión" />
                </div>
            </div>
        </section>

        <div class="contenido">
            <section class="estadisticas q-mt-lg">
                <div class="box1 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">TOTAL PROVEEDORES</span>
                        <div class="cuadrito q-mr-md "
                            style="width: 25px; height: 20px; background-color: #3454D1; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ totalProveedores.toLocaleString('es-CO') }}</span>
                        <!-- <span class="porcentajeMensual text-primary">12% este mes</span> -->
                    </div>
                </div>
                <div class="box2 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">PENDIENTE DE ACTUALIZACION</span>
                        <div class="cuadrito q-mr-md "
                            style="width: 25px; height: 20px; background-color: #6FC33D; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">{{ totalProveedoresPendientes }}</span>
                        <span class="porcentajeMensual text-grey-5" >Requiere atención inmediata</span>
                    </div>
                </div>
                <div class="box3 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">CUMPLIMIENTO GENERAL</span>
                        <div class="cuadrito q-mr-md "
                            style="width: 25px; height: 20px; background-color: #142808; border-radius: 5px;"></div>
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

                <div v-if="esAdmin" class="btnRegistrarProveedor q-pr-lg">
                    <q-btn @click="persistent = true" class="btn-registrar text-white "
                        label="Registrar nuevo proveedor" />
                </div>
            </section>

            <section class="tablaProveedores">
                <div class="q-pa-md">
                    <q-table 
                        title="Proveedores" 
                        :rows="proveedorVisibles" 
                        :columns="columns"
                        :visible-columns="columnasVisibles"
                        virtual-scroll
                        :virtual-scroll-sticky-size-start="48"
                        row-key="NIT" 
                        :loading="loadingTabla"
                        no-data-label="No hay datos disponibles"
                        rows-per-page-label="Registros por página"
                        loading-label="Cargando proveedores..."
                        flat
                        bordered
                        dense
                        separator="horizontal"
                        class="tabla-diseno"
                    >
                        <!-- Personalizar columna Razón Social -->
                        <template v-slot:body-cell-RazonSocial="props">
                            <q-td :props="props">
                                <span class="texto-razon-social">
                                    {{ formatearRazonSocial(props.row.RazonSocial) }}
                                </span>
                            </q-td>
                        </template>

                        <!-- Personalizar columna de Opciones -->
                        <template v-slot:body-cell-Opciones="props">
                            <q-td :props="props">
                                <!-- Botón para visualizar la información del proveedor -->
                                <div class="row no-wrap q-gutter-xs">
                                    <q-btn
                                       flat
                                       icon="visibility"
                                       color="secondary"
                                       @click="abrirModalVisualizar(props.row)"
                                    >
                                       <q-tooltip transition-show="scale" transition-hide="scale">
                                           Visualizar información del proveedor
                                       </q-tooltip>
                                    </q-btn>
                                   <!-- Botón de editar -->
                                   <q-btn 
                                        v-if="esAdmin"
                                        flat round dense
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
                                        v-if="esAdmin"
                                        flat round dense
                                        icon="person_off" 
                                        color="grey" 
                                        @click="inactivarProveedor(props.row)" 
                                   >
                                        <q-tooltip transition-show="flip-right" transition-hide="flip-left">
                                           Inactivar proveedor
                                       </q-tooltip>
                                    </q-btn>
                                   <!-- Botón solicitar actualización -->
                                   <q-btn 
                                        v-if="esAdmin"
                                        flat round dense
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

                        <!-- Diferenciar los estados por medio de colores -->
                        <template v-slot:body-cell-estadoEnlace="props">
                            <q-td :props="props">
                                <q-badge
                                    v-if="props.row.estado === 'Invitación_enviada'"
                                    color="warning"
                                    text-color="black"
                                >
                                    Pendiente
                                </q-badge>
                                <q-badge
                                    v-else-if="props.row.estado === 'Invitación_usada'"
                                    color="positive"
                                >
                                    ✅ Completado
                                </q-badge>
                                <span v-else class="text-grey-6">-</span>
                            </q-td>
                        </template>

                        <template v-slot:body-cell-estadoProveedor="props">
                            <q-td :props="props">
                                <q-badge
                                    :color="getBadgeColor(props.row.estadoProveedor)"
                                    text-color="white"
                                >
                                    {{ props.row.estadoProveedor }}
                                </q-badge>
                            </q-td>
                        </template>

                    </q-table>
                    <!-- Botón de Cargar más proveedores -->
                    <div v-if="!modoBusqueda && hasMore" class="q-pa-md text-center">
                        <q-btn
                            color="primary"
                            label="Cargar más proveedores"
                            :loading="loadingPaginado"
                            @click="cargarSiguiente"
                            no-caps
                        />
                    </div>
                    <div v-else-if="!loadingPaginado && proveedoresPaginados.length > 0" class="q-pa-md text-center text-grey-6">
                        No hay más proveedores para mostrar (total: {{ proveedoresPaginados.length }})
                    </div>
                </div>
            </section>

            <!-- MODAL CREAR USUARIO -->
            <section class="dialogoCrearUsuario">
                <q-dialog v-model="persistentUsuario" persistent transition-show="scale"
                    transition-hide="scale" class="">
                    <q-card style="width: 520px; border-radius: 16px; overflow: hidden;">

                        <!-- Franja de marca -->
                        <q-card-section class="q-pa-none"
                            style="background: linear-gradient(125deg,#6FC33D 0%,#4f8f3a 50%,#3454D1 130%);">
                            <div class="row items-center justify-between q-px-lg q-py-md">
                                <div>
                                    <div style="color: #eafbe0; font-size: 11px; letter-spacing: 2px; font-weight: 700;">
                                        ADMINISTRACION
                                    </div>
                                    <div class="text-h6 text-white text-weight-bold" style="letter-spacing: -0.3px;">
                                        {{ creadoConExito ? 'Invitación enviada' : 'Invitar usuario' }}
                                    </div>
                                </div>
                                <q-btn 
                                    flat
                                    round
                                    dense
                                    icon="close"
                                    color="white"
                                    v-close-popup
                                />
                            </div>
                        </q-card-section>

                        <!-- PASO1: datos -->
                        <q-form v-if="!creadoConExito" @submit.prevent="crearUsuario">
                            <q-card-section class="q-pt-lg">
                                <q-input class="q-mb-md" v-model="nombreUsuario" filled lazy-rules
                                    :rules="[val => !!val?.trim() || 'El nombre es requerido']"
                                    label="Nombre completo" />

                                <q-input class="q-mb-md" v-model="correoUsuario" filled lazy-rules
                                    :rules="emailRules" type="email" label="Correo de acceso"
                                    hint="A este correo le llegará el link para crear su contraseña" />

                                <q-select
                                    class="q-mb-sm"
                                    v-model="rolUsuario"
                                    filled
                                    lazy-rules
                                    :rules="[val => !!val || 'Asigna un rol']"
                                    :options="optionsRol"
                                    label="Rol"
                                    emit-value
                                    map-options
                                >
                                    <template #selected-item="scope">
                                        <q-badge
                                            :style="{ backgroundColor: rolChipColor(scope.opt.value), color: '#fff' }"
                                            class="q-px-sm q-py-xs"
                                        >
                                            {{ scope.opt.label }}
                                        </q-badge>
                                    </template>

                                    <template #option="scope">
                                        <q-item v-bind="scope.itemProps">
                                            <q-item-section>
                                                <q-badge
                                                    :style="{ backgroundColor: rolChipColor(scope.opt.value), color: '#fff' }"
                                                >
                                                    {{ scope.opt.label }}
                                                </q-badge>
                                            </q-item-section>
                                        </q-item>
                                    </template>
                                </q-select>

                                <!-- Preview del correo (confirmación visual) -->
                                <div v-if="correoUsuario && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoUsuario)"
                                    class="q-mt-md q-pa-sm rounded-borders"
                                    style="background:#DAEAD0; border-left:4px solid #6FC33D;">
                                    <div class="text-caption" style="color:#142808; opacity:.7;">Se enviará invitación a</div>
                                    <div class="text-weight-bold" style="color:#142808;">{{ correoUsuario }}</div>
                                </div>
                            </q-card-section>

                            <q-card-section class="q-px-lg q-pb-lg row justify-end q-gutter-sm"
                                style="background:#f7fbf4;">
                                <q-btn flat label="Cancelar" color="grey-8" v-close-popup />
                                <q-btn type="submit" unelevated
                                    :loading="loadingCrearUsuario" :disable="loadingCrearUsuario"
                                    style="background:#3454D1; color:#fff; font-weight:600;"
                                    icon="mail_lock" label="Enviar invitación" />
                            </q-card-section>
                        </q-form>

                        <!-- PASO 2: éxito -->
                        <q-card-section v-else class="q-pa-xl text-center">
                            <q-icon name="check_circle" color="positive" size="64px">
                                <q-tooltip>Listo</q-tooltip>
                            </q-icon>
                            <div class="text-h6 text-weight-bold q-mt-md" style="color: #142808;">
                                ¡Listo, {{ nombreUsuario }} fue invitado!
                            </div>
                            <p class="text-body2 q-mt-sm" style="color: #3a4a30;">
                                Le enviamos un correo a <strong>{{ correoUsuario }}</strong> con un enlace seguro
                                para que defina su propia contraseña. El link expira en 24 horas.
                            </p>
                            <q-btn unelevated class="q-mt-md full-width" v-close-popup style="background: #6FC33D; color: #142808; font-weight: 600;" label="Cerrar" />
                        </q-card-section>
                    </q-card>
                </q-dialog>
            </section>

            <!-- MODAL REGISTRO -->
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
                                <q-input 
                                    class="q-mb-md bg-white input"
                                    v-model="CorreoElectronico" 
                                    filled lazy-rules
                                    :rules="emailRules" 
                                    type="email"
                                    label="Correo destino:" 
                                />
                                <q-input
                                    class="q-mb-md bg-white input"
                                    v-model="ccEmail"
                                    filled
                                    type="email"
                                    label="Copia a (CC) - opcional"
                                />
                            </q-card-section>

                            <q-card-section class="q-pa-none bg-grey-3"
                                style="display: flex; justify-content: flex-end; gap: 10px;">
                                <q-card-actions align="right">
                                    <q-btn class="bg-white text-black" flat label="Cancelar" v-close-popup />
                                </q-card-actions>
                                <q-card-actions align="right">
                                    <q-btn type="submit" :loading="loadingInvitacion"
                                    :disable="loadingInvitacion"
                                     class="bg-primary text-white" flat
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
                        <q-card-section class="bg-green text-secondary row items-center justify-between">
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
                            <q-btn
                                v-if="modalDesdeNotificacion && formDataView.estadoProveedor === 'Pre-registro'"
                                label="Ir a aprobar pre-registro"
                                color="secondary"
                                icon="open_in_new"
                                unelevated
                                class="q-mr-auto"
                                @click="irAAprobarPreRegistro"
                                
                            />
                            <q-btn label="Cerrar" color="primary" v-close-popup unelevated />
                        </q-card-actions>
                    </q-card>
                </q-dialog>
            </section>

            <!-- SECCIÓN: MODAL DE ACTUALIZACION -->
            <section class="dialogoActualizar">
                <q-dialog v-model="persistentEdit" @hide="nuevosDocumentosEdit = []" persistent transition-show="scale" transition-hide="scale">
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
                                                <q-item-label class="text-weight-bold text-dark">{{ doc.tipo }}</q-item-label>
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
                                    💡 Para modificar documentos, contacta al proveedor.
                                    Puedes adjuntar documentos adicionales aquí.
                                    </p>
                                </div>

                                <!-- Subir nuevos documentos -->
                                 <div class="q-mb-md">
                                    <p class="text-subtitle2 text-secondary q-mb-sm">Subir nuevos documentos</p>
                                    <q-file
                                        v-model="nuevosDocumentosEdit"
                                        multiple
                                        outlined
                                        label="Seleccionar archivos PDF"
                                        accept=".pdf"
                                        counter
                                    >
                                        <template v-slot:prepend>
                                            <q-icon name="attach_file" />
                                        </template>
                                    </q-file>
                                    <div v-if="nuevosDocumentosEdit.length > 0" class="q-mt-sm">
                                        <p class="text-caption text-grey-7">Archivos listos para subir:</p>
                                        <ul class="q-pl-md">
                                            <li v-for="(file, idx) in nuevosDocumentosEdit" :key="idx" class="text-caption">
                                                {{ file.name }} ({{ (file.size / 1024).toFixed(0) }} KB)
                                            </li>
                                        </ul>
                                    </div>
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
                                    <q-btn type="submit" :loading="loadingEdicion" :disable="loadingEdicion" class="bg-primary text-white" flat
                                        label="Guardar Cambios" />
                                </q-card-actions>
                            </q-card-section>
                        </q-form>
                    </q-card>
                </q-dialog>
            </section>

            <!-- Dialogo de confirmación global -->
            <ConfirmDialog 
                :model-value="confirmOpen"
                :options="confirmOptions"
                @resolve="handleResolve"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
$verde: #6FC33D;
$azul: #3454D1;
$verde-claro: #DAEAD0;
$verde-oscuro: #142808;

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.pantallaProveedores {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background-color: #f7fbf4;
    color: $verde-oscuro;
}

/* HEADER */
.contenidoHeader {
    display: flex;
    align-items: center;
    min-height: 70px;
    background-color: white;
    padding: 10px 0;
    border-bottom: 2px solid $verde-claro;
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
    max-width: 100px;
}

.chip-usuario {
    background-color: $verde-claro;
    color: $verde-oscuro;
    border: 1px solid $verde;
    font-weight: 500;
}

/* Menú de administración */
.btn-admin {
    transition: background-color 0.2s ease, transform 0.15s ease;

    &:hover {
        background-color: $verde-claro;
        transform: translateY(-1px);
    }
}

.menu-admin {
    min-width: 260px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(20, 40, 8, 0.12);

    &__header {
        background-color: $verde-claro;
        color: $verde-oscuro;
        font-weight: 700;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        font-size: 0.72rem;
    }

    &__item {
        transition: background-color 0.18s ease, padding-left 0.18s ease;

        &:hover {
            background-color: rgba(111, 195, 61, 0.10);
            padding-left: 22px;  /* pequeño deslizamiento al pasar el mouse */
        }
    }
}

/* NOTIFICACIONES */
.btn-notificaciones {
    position: relative;

    :deep(.q-badge) {
        font-weight: 700;
        padding: 2px 6px;
    }
}

.header-notificaciones {
    background-color: $verde-claro;
    color: $verde-oscuro;
    font-weight: 600;
}

.logout {
    color: $verde-oscuro;
    border: 1px solid $verde;
    border-radius: 12px;
    white-space: nowrap;
    background-color: white;
    transition: all 0.2s ease;
}

.logout:hover {
    background-color: $verde-claro;
}

.contenido {
    margin: 0px auto;
    width: 95%;
}

/* ESTADISTICAS */
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
    border-radius: 12px;
    background-color: white;
    padding: 15px;
    border: 1px solid $verde-claro;
    box-shadow: 0px 2px 8px rgba(20, 40, 8, 0.05);
}

.estadisticas .box1 {
    border-top: 4px solid $azul;
}

.estadisticas .box2 {
    border-top: 4px solid $verde;
}

.estadisticas .box3 {
    border-top: 4px solid $verde-oscuro;
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
    border: 1px solid $verde-claro;
    padding: 15px;
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

.btn-registrar {
    background-color: $verde;
    color: $verde-oscuro;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.2s ease;
}

.btn-registrar:hover {
    background-color: $verde-claro;
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
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid $verde-claro;
}

.tabla-diseño :deep(.celda-opciones) {
    background-color: #ffffff;
    box-shadow: -6px 0 8px -6px rgba(0, 0, 0, 0.12);
}

.tabla-diseño :deep(.q-table tbody tr:hover .celda-opciones) {
    background-color: rgba(218, 234, 208, 0.35);
}

:deep(.q-table__top) {
    background-color: white;
    border-bottom: 2px solid $verde-claro;
}

:deep(.q-table__title) {
    color: $verde-oscuro;
    font-weight: 600;
}

:deep(.q-table) {
    overflow-x: auto;
}

:deep(.q-table th) {
    background-color: $verde-claro;
    color: $verde-oscuro;
    font-weight: 600;
}

:deep(.q-table__middle) {
    min-width: 100%;
}

@media (min-width: 1024px) {
  :deep(.q-table__middle) {
    min-width: 1200px; /* solo en escritorio, para que no se aplasten */
  }
}

:deep(.q-table tbody tr) {
    transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
    background-color: rgba(218, 234, 208, 0.35);
}

:deep(.q-badge) {
    border-radius: 8px;
    padding: 4px 8px;
    font-weight: 500;
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
    background-color: rgba(218, 234, 208, 0.35) !important;
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