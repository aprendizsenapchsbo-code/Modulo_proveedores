<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useProveedorStore } from '../stores/proveedor.js';
import { useAprobarPreRegistroStore } from '../stores/aprobarPreRegistro.js';
import { exitoNotify, errorNotify } from '../composables/Notify.js';
import { router } from '../routes/router.js';
import apiClient from '../services/axios.js';

const route = useRoute();
const routerVue = useRouter();
const tokenValido = ref(false);
const cargando = ref(true);
const proveedorStore = useProveedorStore();
const aprobacionPreRegistroStore = useAprobarPreRegistroStore();

// MODO (para determinar si es pre-registro o actualización)
const modo = ref('preregistro'); // preregistro o actualización
const tokenActualizacion = ref(null);
const documentosExistentes = ref([]);

// Datos del formulario
const pais = ref('');
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

// Cargar directa a SharePoint
const MAX_FILE_SIZE = 10 * 1024 * 1024; //10MB

async function solicitarUrlsCarga(token, archivosInfo, razonSocial) {
    // archivosInfo: [{ nombreOriginal, tipo }]
    const response = await apiClient.post(`api/proveedor/solicitar-urls-carga/${token}`, {
        archivos: archivosInfo,
        razonSocial: razonSocial
    });
    return response.data;  // { success, urls: [{ nombre, nombreOriginal, tipo, uploadUrl }] }
}

async function subirArchivoUrl(uploadUrl, file) {
    const fileSize = file.size;
    const range = `bytes 0-${fileSize-1}/${fileSize}`;
    // Usamos fetch porque axios podría tener problemas con streams en navegador
    const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/octet-stream',
            'Content-Range': range
         },
        body: file
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al subir archivo: ${response.status} ${errorText}`);
    }
    return true;
}

// Subir varios archivos en secuencia
async function subirArchivos(urls, archivosPorIndice) {
    const resultados = [];
    for (let i = 0; i < urls.length; i++) {
        const { uploadUrl, nombre, tipo, nombreOriginal } = urls[i];
        const file = archivosPorIndice[i];
        console.log(`Subiendo archivo ${i}: ${nombreOriginal} (${file.size} bytes) a ${uploadUrl}`);
        try {
            await subirArchivoUrl(uploadUrl, file);
            console.log(`Subida exitosa: ${nombreOriginal}`);
            resultados.push({ nombre, tipo, nombreOriginal });
        } catch (err) {
            throw new Error(`Fallo al subir "${nombreOriginal}": ${err.message}`);
            throw err;
        }
    }
    return resultados;
}

// Función auxiliar para obtener los tipos de documentos según contribuyente
function obtenerTiposDocumentosRequeridos(tipoContribuyente, pais) {
    // Normalizar: convertir a minusculas y eliminar espacios
    const paisNormalizado = pais?.trim().toLowerCase() || '';
    const esColombia = paisNormalizado === 'colombia';

    if (!esColombia) {
        // Documentos base comunes para ambos tipos
        const documentosBase = [
            'IDENTIFICACION TRIBUTARIA DEL PAIS ORIGEN (EIN, RFC, VAT ID)',
            'CERTIFICACION BANCARIA (Con SWIFT / BIC / IBAN)',
        ];

        if (tipoContribuyente === 'Persona Jurídica') {
            return [
                ...documentosBase,
                'CERTIFICADO DE EXISTENCIA Y REPRESENTACION LEGAL O EQUIVALENTE AL PAIS',
                'COPIA DEL PASAPORTE DEL REPRESENTANTE LEGAL',
                'ESTADOS FINANCIEROS'
            ];
        } else if (tipoContribuyente === 'Persona Natural') {
            return [
                ...documentosBase,
                'COPIA DEL PASAPORTE O DOCUMENTO DE IDENTIDAD',
                'DECLARACIÓN JURADA DE INGRESOS (si aplica)'
            ];
        }
    }

    if (esColombia){
        if (tipoContribuyente === 'Persona Jurídica') {
            return [
                'COPIA DE RUT COMPLETO',
                'COPIA DE CAMARA COMERCIO VIGENTE (Menor a 90 días)',
                'COPIA DE DOCUMENTO DE IDENTIFICACION DEL REPRESENTANTE LEGAL',
                'CERTIFICACION BANCARIA',
                '2 CERTIFICADOS COMERCIALES',
                'ESTADOS FINANCIEROS COMPARATIVOS DE LOS (2) ULTIMOS AÑOS'
            ];
        } else if (tipoContribuyente === 'Persona Natural') {
            return [
                'COPIA DE RUT COMPLETO',
                'COPIA DE DOCUMENTO DE IDENTIFICACION DEL REPRESENTANTE LEGAL',
                'CERTIFICACIÓN BANCARIA'
            ];
        }
    }
    return [];
}

const configIdentificacion = computed(() => {
    const esColombia = pais.value?.trim().toLowerCase() === 'colombia';
    
    return {
        label: esColombia ? 'Número de Identificación Tributaria (NIT)' : 'Número de Identificación Fiscal / Tax ID',
        placeholder: esColombia ? 'Ej: 900.123.456-7' : 'Ej: EIN, RFC, VAT ID',
        rules: [
            val => !!val || 'Este campo es obligatorio',
            // Solo validamos formato colombiano si el país es Colombia
            val => {
                if (!esColombia) return true; 
                // Regex simple para NIT colombiano (puedes ajustarla según tu necesidad)
                const nitRegex = /^\d{1,10}$/; 
                return nitRegex.test(val) || 'El NIT debe contener solo números';
            }
        ]
    };
});

// Precargar datos (modo actualización)
function precargarDatos(data) {
    // Información general
    pais.value = data.Pais || '';
    nit.value = data.NIT || '';
    dv.value = data.DV || '';
    razonSocial.value = data.RazonSocial || '';
    direccionNotificacion.value = data.DireccionNotificacion || '';
    telefono.value = data.Telefono || '';
    ciudad.value = data.Ciudad || '';
    // Información del Representante Legal
    nombreRepresentante.value = data.NombreRepresentante || '';
    tipoDocumentoRepresentante.value = data.TipoDocumentoRepresentante || '';
    numeroIdentificacion.value = data.NumeroIdentificacion || '';
    telefonoRepresentante.value = data.TelefonoRepresentante || '';
    correoElectronicoRepresentante.value = data.CorreoElectronicoRepresentante || '';
    // Información representante comercial
    nombreRepresentanteComercial.value = data.NombreRepresentanteComercial || '';
    cargoRepresentanteComercial.value = data.CargoRepresentanteComercial || '';
    telefonoRepresentanteComercial.value = data.TelefonoRepresentanteComercial || '';
    correoElectronicoRepresentanteComercial.value = data.CorreoElectronicoRepresentanteComercial || '';
    // Información del responsable de facturación
    nombresApellidosResponsable.value = data.NombresApellidosResponsable || '';
    cargoResponsableFacturacion.value = data.CargoResponsableFacturacion || '';
    correoElectronicoResponsable.value = data.CorreoElectronicoResponsable || '';
    // Otra información
    tipoContribuyente.value = data.TipoContribuyente || '';
    tipoProveedor.value = data.TipoProveedor || '';
    otroTipoProveedor.value = data.OtroTipoProveedor || '';
    // Documentos
    if (data.Documentos && Array.isArray(data.Documentos)) {
        documentosExistentes.value = data.Documentos;
    }

    // Obtener tipos de documentos requeridos según el tipo de contribuyente
    const tiposRequeridos = obtenerTiposDocumentosRequeridos(data.TipoContribuyente, data.Pais);

    // Obtener documentos existentes del proveedor
    const docsExistentes = data.Documentos || [];
    console.log('Documentos existente:', docsExistentes);

    // Construir documentosRequeridos con la estructura esperada
    documentosRequeridos.value = tiposRequeridos.map(tipo => {
        const existente = docsExistentes.find(doc => doc.tipo === tipo);
        return {
            tipo: tipo,
            archivo: [],
            nombreExistente: existente ? existente.nombreOriginal : null,
            urlExistente: existente ? existente.url : null,
            reemplazar: false,
        };
    });
}

onMounted(async () => {
    // console.log('Token proveedor en store:', proveedorStore.tokenRegistro);
    const tokenFormUrl = route.params.token;
    if (!tokenFormUrl) {
        errorNotify('Enlace inválido');
        routerVue.push('/token-invalido');
        return;
    }
    // 1. Intentar obtener datos como token de actualización
    try {
        const response = await apiClient.get(`api/proveedor/actualizacion/${tokenFormUrl}`);
        if (response.data.success) {
            // Modo actualización
            modo.value = 'actualizacion';
            tokenActualizacion.value = tokenFormUrl;
            precargarDatos(response.data.data);
            tokenValido.value = true;
            exitoNotify('Formulario precargado con tus datos. Modifica lo necesario.');
            cargando.value = false;
            return;
        }
    } catch (error) {
        // Si da 404 no es token de actualización
        if (error.response?.status !== 404) {
            errorNotify('Error al verificar el enlace');
            routerVue.push('/token-invalido');
            return;
        }
    }
    // 2. Si no es actualización, validar como token de pre-registro
    try {
        const response = await apiClient.get(`api/proveedor/verificar-token/${tokenFormUrl}`);
        if (response.data.success) {
            modo.value = 'preregistro';
            tokenValido.value = true;
            proveedorStore.setTokenRegistro(tokenFormUrl);
        } else {
            errorNotify(response.data.msg || 'El enlace ha expirado o ya fue utilizado');
            routerVue.push('/token.invalido')
        }
    } catch (error) {
        errorNotify(error.response?.data?.msg || 'Error al validar el enlace');
        routerVue.push('/token-invalido')
    } finally {
        cargando.value = false;
    }
});

watch(tipoContribuyente, (nuevoValor) => {
    if (modo.value === 'preregistro') {
        obtenerDocumentosObligatorios();
    } else if (modo.value === 'actualizacion' && nuevoValor) {
        const tiposRequeridos = obtenerTiposDocumentosRequeridos(nuevoValor, pais.value);

        const docsExistentes = documentosExistentes.value || [];
        documentosRequeridos.value = tiposRequeridos.map(tipo => {
            const existente = docsExistentes.find(doc => doc.tipo === tipo);
            //Buscar también en documentosRequeridos actual (por si hay archivo subido)
            const actual = documentosRequeridos.value.find(d => d.tipo === tipo);
            return {
                tipo: tipo,
                archivo: actual?.archivo || [],
                nombreExistente: existente ? existente.nombreOriginal : null,
                urlExistente: existente ? existente.url : null,
                reemplazar: actual?.reemplazar || false
            };
        });
    }
});

// Watch para el cambio de pais también debe actualizar documentos
watch(pais, (nuevoPais) => {
    if (tipoContribuyente.value && modo.value === 'preregistro') {
        obtenerDocumentosObligatorios();
    } else if (tipoContribuyente.value && modo.value === 'actualizacion') {
        const tiposRequeridos = obtenerTiposDocumentosRequeridos(tipoContribuyente.value, nuevoPais);
        const docsExistentes = documentosExistentes.value || [];
        documentosRequeridos.value = tiposRequeridos.map(tipo => {
            const existente = docsExistentes.find(doc => doc.tipo === tipo);
            const actual = documentosRequeridos.value.find(d => d.tipo === tipo);
            return {
                tipo: tipo,
                archivo: actual?.archivo || [],
                nombreExistente: existente ? existente.nombreOriginal : null,
                urlExistente: existente ? existente.url : null,
                reemplazar: actual?.reemplazar || false
            };
        });
    }
});

async function limpiarFormulario() {
    pais.value = '';
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

// Función auxiliar para formatear los bytes a megabytes
const formatearTamanoArchivo = (archivos) => {
    if (!archivos || archivos.length === 0) return '';

    // Sumar el tamaño de todos los archivos seleccionados
    const totalBytes = archivos.reduce((acc, file) => acc + (file.size || 0), 0);
    const mb = (totalBytes / (1024 * 1024)).toFixed(2);

    return archivos.length === 1
        ? `${mb} MB`
        : `${archivos.length} archivos (${mb} MB)`;
}

const nuevosArchivos = ref([]);
// Envío del formulario
async function crearRegistro() {
    loading.value = true;
    intentoEnviar.value = true;

    /* // Validación del tamaño de los archivos
    const MAX_SIZE = 5 * 1024 * 1024; //5MB
    let archivosGrandesEncontrados = false;

    for (const doc of documentosRequeridos.value) {
        if (doc.archivo && doc.archivo.length > 0) {
            for (const file of doc.archivo) {
                if (file.size > MAX_SIZE) {
                    errorNotify(`El archivo "${file.name}" excede el tamaño máximo de 5MB`);
                    loading.value = false;
                    return;  // Detenemos la ejecución inmediatamente
                }
            }
        }
    } */

    const token = modo.value === 'preregistro' ? route.params.token : tokenActualizacion.value;
    if (!token) {
        errorNotify('Sesión expirada o enlace inválido. Por favor, solicite un nuevo enlace');
        loading.value = false;
        return;
    }

    // Validaciones comunes
    if (!nit.value || !razonSocial.value || !direccionNotificacion.value) {
        errorNotify('Por favor complete todos los campos obligatorios');
        loading.value = false;
        return;
    }

    // Validación solo para pre-registro
    if (modo.value === 'preregistro') {
        if (!autorizaDatosPersonales.value || !autorizaConflictos.value) {
            errorNotify('Debe leer y aceptar ambas autorizaciones para continuar con el registro.');
            // Abrir el diálogo que falta
            if (!autorizaDatosPersonales.value) dialogDatos.value = true;
            else if (!autorizaConflictos.value) dialogConflictos.value = true;
            loading.value = false;
            return;
        }
    };

        /* //Validar que cada documento obligatorio tenga un archivo asignado
        const documentosFaltantes = documentosRequeridos.value.filter(d => !d.archivo || d.archivo.length === 0);
        if (documentosFaltantes.length > 0) {
            errorNotify(`Faltan ${documentosFaltantes.length} documento(s) por cargar.`);
            loading.value = false;
            return;
        } */
        /* Recolección de Archivos y Tipos */
        // Construir dos arrays paralelos: archivos (File) y metadatos (tipo, nombreOriginal)
        const archivosParaSubir = [];  // File objects
        const archivosInfo = [];  // { nombreOriginal, tipo }

        // a) Documentos requeridos
        for (const doc of documentosRequeridos.value) {
            if (doc.archivo && doc.archivo.length > 0) {
                for (const file of doc.archivo) {
                    // Validar tamaño individual 
                    if (file.size > MAX_FILE_SIZE) {
                        errorNotify(`El archivo "${file.name}" supera el tamaño máximo de 5 MB`);
                        loading.value = false;
                        return;
                    }
                    archivosParaSubir.push(file);
                    archivosInfo.push({ nombreOriginal: file.name, tipo: doc.tipo });
                }
            }
        }

        /* // b) Archivos adicionales (solo en actualización)
        if (modo.value === 'actualizacion' && nuevosArchivos.value.length > 0) {
            errorNotify('Debe cargar al menos un documento.');
            loading.value = false;
            return;
        } */

        // PASO 1: Obtener URLs de carga
        let urlsCarga = [];
        try {
            const resp = await solicitarUrlsCarga(token, archivosInfo, razonSocial.value.trim());
            urlsCarga = resp.urls;  // [{ nombre, nombreOriginal, tipo, uploadUrl }]
        } catch (error) {
            console.error('Error al solicitar URLs de carga:', error);
            errorNotify(error.response?.data?.msg || 'Error al preparar la carga de documentos');
            loading.value = false;
            return;
        }

        // PASO 2: Subir archivos directamente a SharePoint
        let archivosSubidos = [];
        try {
            archivosSubidos = await subirArchivos(urlsCarga, archivosParaSubir);
        } catch (error) {
            console.error('Error al subir archivos:', error);
            errorNotify(error.message || 'Error al subir los documentos');
            loading.value = false;
            return;
        }

        // PASO 3: Enviar metadatos y referencia al backend
        const datosProveedor = {
            Pais: pais.value.trim(),
            NIT: nit.value.trim(),
            DV: dv.value,
            RazonSocial: razonSocial.value.trim(),
            DireccionNotificacion: direccionNotificacion.value.trim(),
            Telefono: telefono.value.trim(),
            Ciudad: ciudad.value.trim(),
            NombreRepresentante: nombreRepresentante.value.trim(),
            TipoDocumentoRepresentante: tipoDocumentoRepresentante.value.trim(),
            NumeroIdentificacion: numeroIdentificacion.value.trim(),
            TelefonoRepresentante: telefonoRepresentante.value.trim(),
            CorreoElectronicoRepresentante: correoElectronicoRepresentante.value.trim(),
            NombreRepresentanteComercial: nombreRepresentanteComercial.value.trim(),
            CargoRepresentanteComercial: cargoRepresentanteComercial.value.trim(),
            TelefonoRepresentanteComercial: telefonoRepresentanteComercial.value.trim(),
            CorreoElectronicoRepresentanteComercial: correoElectronicoRepresentanteComercial.value.trim(),
            NombresApellidosResponsable: nombresApellidosResponsable.value.trim(),
            CargoResponsableFacturacion: cargoResponsableFacturacion.value.trim(),
            CorreoElectronicoResponsable: correoElectronicoResponsable.value.trim(),
            TipoContribuyente: tipoContribuyente.value,
            TipoProveedor: tipoProveedor.value,
            OtroTipoProveedor: otroTipoProveedor.value.trim(),
            AutorizaDatosPersonales: modo.value === 'preregistro' ? autorizaDatosPersonales.value : true,
            AutorizaConflictos: modo.value === 'preregistro' ? autorizaConflictos.value : true,
        };

        const bodyFinal = {
            ...datosProveedor,
            archivosSubidos  // contiene [{ nombre, tipo, nombreOriginal }]
        };

        try {
            let response;
            if (modo.value === 'preregistro') {
                /* // Enviar con FormData (incluye documentos)
                const formData = new FormData();
                // Agregar los datos del proveedor como un string JSON
                formData.append('datosProveedor', JSON.stringify(datosProveedor));
    
                // Adjuntar cada archivo
                for (const doc of documentosRequeridos.value) {
                    if (doc.archivo && doc.archivo.length > 0) {
                        for (const file of doc.archivo) {
                            formData.append('documentos', file);
                        }
                    }
                } */
                // Enviar la petición con multipart/form-data
                response = await apiClient.post(
                    `api/proveedor/registro/completar-registro-carga-directa/${token}`, bodyFinal);
                if (response.data.success) {
                    aprobacionPreRegistroStore.setRazonSocialProveedor(response.data.RazonSocial);
                    aprobacionPreRegistroStore.setPreRegistroAprobar(response.data);
                    exitoNotify('Registro creado exitosamente')
                    router.push('/registro-exitoso')
                }
            } else {
                // Actualización:
                /* const formData = new FormData();
                formData.append('datosProveedor', JSON.stringify(datosProveedor));
    
                // Archivos de documentos requeridos
                const tipos = [];
                let globalIndex = 0;
                for (let i = 0; i < documentosRequeridos.value.length; i++) {
                    const doc = documentosRequeridos.value[i];
                    if (doc.archivo && doc.archivo.length > 0) {
                        for (const file of doc.archivo) {
                            formData.append('documentos', file);
                            tipos.push({ index: globalIndex, tipo: doc.tipo });
                            globalIndex++;
                        }
                    }
                }
    
                // Archivos adicionales (no tienen tipo asociado o se asignan tipo "adicional")
                for (const file of nuevosArchivos.value) {
                    formData.append('documentos', file);
                    tipos.push({ index: globalIndex, tipo: 'Adicional' });
                    globalIndex++;
                }
                formData.append('tiposDocumentos', JSON.stringify(tipos)); */
    
                response = await apiClient.put(`api/proveedor/${token}/actualizar-datos-carga-directa`, bodyFinal);
    
            if (response.data.success) {
                exitoNotify('Datos actualizados exitosamente');
                router.push('/registro-exitoso');
            }
        }
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

// Manejo de autorizaciones (solo pre-registro)
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
    // Usar la función principal que considera el país
    const tiposRequeridos = obtenerTiposDocumentosRequeridos(tipoContribuyente.value, pais.value);

    // Crear estructura con estado por documento
    documentosRequeridos.value = tiposRequeridos.map(tipo => ({
        tipo,
        archivo: [],
        url: null,
        subido: false
    }));

    console.log('documentosRequeridos inicializado:', documentosRequeridos.value);

}

</script>

<template>

    <div v-if="cargando" class="flex flex-center" style="height: 100vh; background-color: #f5f5f5;">
        <div class="text-center">
            <q-spinner size="60px" color="primary"/>
            <p class="q-mt-md text-grey-7">Cargando formulario, espere un momento...</p>
        </div>
    </div>

    <div v-else class="pantallaProveedor bg-grey-2" style="height: 100vh; padding-bottom: 2rem;">
        <div class="titulo ">
            <h1 class="text-h3 text-weight-bold text-center text-secondary q-mb-md q-pt-md">
                {{ modo === 'preregistro' ? 'Formulario de Proveedor' : 'Actualización de Datos' }}
            </h1>
            <p class="text-body1 text-center text-grey-6 q-pb-md" style="width: 300px; margin: 0 auto;">
                <span v-if="modo === 'preregistro'">
                    Complete los datos generales y cargue la documentación requerida.
                </span>
                <span v-else>
                    Modifique los campos que necesite actualizar. Puede agregar nuevos documentos
                </span>
            </p>
        </div>

        <section
            style="width: 90%; margin: 0 auto; background-color: white; border: 1px solid #ccc; padding: 20px; border-radius: 10px;">
            <q-form @submit.prevent="crearRegistro" class="">
                <!-- INFORMACIÓN GENERAL -->
                <p class="text-h5 text-secondary q-pb-md">Información General</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;" class="q-mb-md">
                    <q-input
                        style="width: 100%;"
                        filled
                        v-model="pais"
                        label="País de origen *"
                        :rules="[val => !!val || 'El país es obligatorio']"
                    />
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 42%;" filled v-model="nit"
                        :label="configIdentificacion.label"
                        :placeholder="configIdentificacion.placeholder"
                        :rules="configIdentificacion.rules"
                        lazy-rules />

                    <q-select v-if="pais === 'Colombia' || pais === 'colombia' || pais === 'COLOMBIA'" style="width: 6%; font-size: 12px;" filled v-model="dv" :options="dvOpciones" label="DV"
                        emit-value map-options>
                    </q-select>

                    <q-input style="width: 48%;" filled v-model="razonSocial" label="Razón Social" />
                </div>

                <!-- INFORMACION DE NOTIFICACION -->
                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información de Notificación</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 100%;" filled v-model="direccionNotificacion"
                        label="Dirección de Notificación" />

                    <q-input style="width: 48%;" filled v-model="telefono" label="Teléfono" />

                    <q-input style="width: 48%;" filled v-model="ciudad" label="Ciudad" />
                </div>

                <!-- REPRESENTANTE LEGAL -->
                <p class="text-h5 text-secondary q-pt-md q-pb-md">Representante Legal</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
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

                <!-- REPRESENTANTE COMERCIAL -->
                <p class="text-h5 text-secondary q-pt-md q-pb-md">Información del Representante Comercial</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 48%;" filled v-model="nombreRepresentanteComercial"
                        label="Nombre del Representante Comercial" />

                    <q-input style="width: 48%;" filled v-model="cargoRepresentanteComercial"
                        label="Cargo del Representante Comercial" />

                    <q-input style="width: 48%;" filled v-model="telefonoRepresentanteComercial"
                        label="Teléfono del Representante Comercial" />

                    <q-input style="width: 48%;" filled v-model="correoElectronicoRepresentanteComercial"
                        label="Correo Electrónico del Representante Comercial" type="email" />
                </div>

                <!-- RESPONSABLE DE FACTURACION -->
                <p class="text-h5 text-secondary q-pt-md q-pb-md">Responsable de Facturación</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-input style="width: 48%;" filled v-model="nombresApellidosResponsable"
                        label="Nombres y Apellidos del Responsable de Facturación" />

                    <q-input style="width: 48%;" filled v-model="cargoResponsableFacturacion"
                        label="Cargo del Responsable de Facturación" />

                    <q-input style="width: 100%;" filled v-model="correoElectronicoResponsable"
                        label="Correo Electrónico del Responsable de Facturación" type="email" />
                </div>

                <!-- DATOS ADICIONALES -->
                <p class="text-h5 text-secondary q-pt-md q-pb-md">Datos Adicionales</p>
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                    <q-select style="width: 48%;" filled v-model="tipoContribuyente" :options="tipoContribuyenteOptions"
                        label="Tipo de Contribuyente" emit-value map-options />

                    <q-select style="width: 48%;" filled v-model="tipoProveedor" :options="tipoProveedorOptions"
                        label="Tipo de Proveedor" emit-value map-options @update:model-value="limpiarOtroSiCambia" />

                    <!-- Input condicional (Solo aparece si es 'Otro') -->
                    <div style="width: 100%;" v-if="tipoProveedor === 'Otro'">
                        <q-input filled v-model="otroTipoProveedor" label="Especifique el tipo de proveedor"
                            placeholder="Ej: Consultoría Ambiental"
                            :rules="[val => !!val || 'Este campo es obligatorio']" lazy-rules class="bg-blue-1" />
                    </div>

                    <!-- AUTORIZACIONES (solo para pre-registro) -->
                    <div v-if="modo === 'preregistro'"
                        style="width: 48%; display: flex; flex-direction: column; gap: 8px;">

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

                <!-- SECCION DE DOCUMENTOS PARA PRE-REGISTRO -->
                <div v-if="modo === 'preregistro' && tipoContribuyente" class="q-mt-md">
                    <p class="text-h6 text-secondary">Carga de Documentos</p>

                    <!-- Lista de documentos obligatorios -->
                    <div class="q-pa-sm bg-blue-1 rounded-borders">
                        <p class="text-weight-bold text-primary q-mb-xs">Documentos requeridos</p>

                        <div v-for="doc in documentosRequeridos" :key="doc.tipo" class="q-ml-md">
                            <p class="text-subtitle2 q-mb-xs">{{ doc.tipo }}</p>
                            {{ console.log(`Renderizando: ${doc.tipo}, archivo:`, doc.archivo) }}

                            <q-file class="q-mb-lg" v-model="doc.archivo" outlined multiple dense hide-upload-btn
                                :label="doc.archivo && doc.archivo.length > 0 ? formatearTamanoArchivo(doc.archivo)
                                : 'Seleccione archivo PDF'"
                                accept=".pdf"
                                :color="doc.archivo && doc.archivo.length > 0 ? 'primary' : 'grey-5'">
                                <template v-if="doc.archivo && doc.archivo.length > 0" #append>
                                    <q-btn flat round dense icon="close" color="grey" @click="doc.archivo = []" />
                                </template>
                            </q-file>

                            <!-- Validación visual por campo -->
                            <span v-if="intentoEnviar && (!doc.archivo || doc.archivo.length === 0)" style="color: red; font-size: 12px;">
                                Este documento es obligatorio.
                            </span>
                        </div>
                    </div>
                </div>
                <p v-else-if="modo === 'preregistro' && !tipoContribuyente" class="text-body2 text-grey-6 q-mt-md">
                    Seleccione el tipo de contribuyente para ver los documentos requeridos.
                </p>

                <!--  SECCION DE DOCUMENTOS PARA ACTUALIZACION -->
                <div v-if="modo === 'actualizacion' && tipoContribuyente" class="q-mt-md">
                    <p class="text-h6 text-secondary">Actualización de Documentos Obligatorios</p>
                    <div class="q-pa-sm bg-blue-1 rounded-borders">
                        <p class="text-weight-bold text-primary q-mb-xs">Documentos requeridos</p>
                        <div v-for="doc in documentosRequeridos" :key="doc.tipo" class="q-ml-md">
                            <p class="text-subtitle2 q-mb-xs">{{ doc.tipo }}</p>
                            <!-- Si ya existe un documento, mostrar información -->
                            <div v-if="doc.urlExistente && !doc.reemplazar" class="q-mb-sm">
                                <a :href="doc.urlExistente" target="_blank">{{ doc.nombreExistente }}</a>
                                <q-btn 
                                    flat 
                                    dense 
                                    icon="refresh"
                                    color="primary"
                                    label="Reemplazar"
                                    @click="doc.reemplazar = true"
                                    class="q-ml-sm"
                                />
                            </div>
                            <!-- Input para subir nuevo archivo (cuando no existe o se quiera reemplazar) -->
                             <div v-if="!doc.urlExistente || doc.reemplazar">
                                <q-file
                                    v-model="doc.archivo"
                                    multiple
                                    outlined
                                    dense
                                    hide-upload-btn
                                    :label="doc.archivo && doc.archivo.length > 0 ? formatearTamanoArchivo(doc.archivo) :  'Seleccione archivo PDF'"
                                    accept=".pdf"
                                    class="q-mb-md"
                                >
                                    <template v-if="doc.archivo && doc.archivo.length > 0" #append>
                                        <q-btn
                                            flat
                                            round
                                            dense
                                            icon="close"
                                            color="grey"
                                            @click="doc.archivo = []"
                                        />
                                    </template>
                                </q-file>
                                <q-btn v-if="doc.reemplazar"
                                    flat
                                    dense
                                    icon="cancel"
                                    label="Cancelar"
                                    @click="doc.reemplazar = false; doc.archivo = []"
                                />
                             </div>
                        </div>
                    </div>
                </div>
                <p v-else-if="modo === 'actualizacion' && !tipoContribuyente" class="text-body2 text-grey-6 q-mt-md">
                    Seleccione el tipo de contribuyente para ver los documentos requeridos.
                </p>

                <div class="q-mt-md" style="display: flex; justify-content: flex-end;">
                    <q-btn type="submit" label="Guardar" color="primary" :loading="loading" />
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
            <q-card-section class="text-justify" style="max-height: 70vh; overflow-y: auto;">
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
            <q-card-section class="text-justify" style="max-height: 80vh; overflow-y: auto;">
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