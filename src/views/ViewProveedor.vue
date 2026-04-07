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
    { label: 'Diseño de obras civiles', value: 'Diseño de obras civiles' },
    { label: 'Otro', value: 'Otro' }
]
const autorizaDatosPersonales = ref(false);
const autorizaConflictos = ref(false);

// Campos para la firma por checkbox
const firmaAceptadaDatosPersonales = ref(false);
const firmaAceptadaConflictos = ref(false);

// Variables para controlar si el dialogo a sido abierto
const dialogDatosAbierto = ref(false);
const dialogConflictosAbierto = ref(false);

const archivos = ref([]);
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
    dialogConflictosAbierto.value = false;
    dialogDatosAbierto.value = false;
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
            TipoDocumentoRepresentante: tipoDocumentoRepresentante.value,
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

        if (!firmaAceptadaDatosPersonales.value || !firmaAceptadaConflictos.value) {
            errorNotify('Debe firmar ambas autorizaciones para continuar con el registro.');
            loading.value = false;
            return;
        }

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

const manejarClickCheckbox = (val, tipo) => {
    // Si el checkbox se desmarca, actualizar el estado correspondiente
    if (val === false) {
        if (tipo === 'datos') {
            autorizaDatosPersonales.value = false;
        } else {
            autorizaConflictos.value = false;
        }
        return;
    }
    // Si el checkbox se marca, verificar si el diálogo ya ha sido abierto antes
    if (tipo === 'datos') {
        if (!dialogDatosAbierto.value) {
            dialogDatos.value = true;
        } else {
            autorizaDatosPersonales.value = true; // Ya lo vio, permitir marcar
        }
    } else {
        if (!dialogConflictosAbierto.value) {
            dialogConflictos.value = true;
        } else {
            autorizaConflictos.value = true; // Ya lo vio, permitir marcar
        }
    }
};

const onDialogDatosClose = () => {
    dialogDatosAbierto.value = true; // Marcar que el diálogo de datos ha sido abierto
    autorizaDatosPersonales.value = true; // Permitir marcar el checkbox después de cerrar el diálogo
};

const onDialogConflictosClose = () => {
    dialogConflictosAbierto.value = true; // Marcar que el diálogo de conflictos ha sido abierto
    autorizaConflictos.value = true; // Permitir marcar el checkbox después de cerrar el diálogo
};

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
                        emit-value
                        map-options
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

                         <!-- Autorización de datos personales -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <q-checkbox
                                :model-value="autorizaDatosPersonales"
                                @update:model-value="(val) => manejarClickCheckbox(val, 'datos')"
                                label="Autorizo el tratamiento de datos personales"
                                :color="!autorizaDatosPersonales ? 'negative' : 'primary'"
                            />

                            <q-btn
                                flat round dense
                                icon="info"
                                color="primary"
                                size="sm"
                                @click="dialogDatos = true"
                            />
                        </div>
                        <span v-if="intentoEnviar && !autorizaDatosPersonales" style="color: red; font-size: 12px;">
                            Debe aceptar la autorización de tratamiento de datos personales.
                        </span>

                        <!-- Autorización de conflictos de intereses -->
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <q-checkbox
                                :model-value="autorizaConflictos"
                                @update:model-value="(val) => manejarClickCheckbox(val, 'conflictos')"
                                label="Confirmo que he leído y acepto la declaración de conflictos de intereses"
                                :color="!autorizaConflictos ? 'negative' : 'primary'"
                            />

                            <q-btn
                                flat round dense
                                icon="info"
                                color="primary"
                                size="sm"
                                @click="dialogConflictos = true"
                            />
                        </div>
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

    <!-- Diálogo de autorización de datos personales -->
    <q-dialog v-model="dialogDatos" maximized @hide="onDialogDatosClose">
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
                    <li>Comunicaciones físicas y/o electrónicas con los empleados del cliente y del proveedor derivadas de la relación comercial</li>
                </ol>

                <p class="text-weight-bold q-mt-md q-mb-md">TRATAMIENTO DE LOS DATOS, DERECHOS DE TITULAR Y MEDIDAS DE SEGURIDAD</p>
                <ul class="q-ml-md">
                    <li>Conozco que los datos que sobre mi se obtengan, serán administrados por <strong>PCH SAN BARTOLOME SAS ESP</strong>, con un nivel adecuado de protección, 
                        asegurando la debida confidencialidad de dicha información y evitando la consulta por parte de terceros no autorizados, 
                        salvo que esta sea requerida por una entidad pública o administrativa en ejercicio de sus funciones legales o por orden judicial, 
                        casos de urgencia médica o sanitaria o en aquellos casos regulados en el artículo 10 de la ley 1581 de 2012.</li>
                    <li>Conozco que la información personal que suministro, se encuentra almacenada en la oficina principal y/o sedes de <strong>PCH SAN BARTOLOME SAS ESP</strong>, 
                        contando con todos las medidas de seguridad físicas, técnicas y administrativas para evitar su perdida, adulteración, uso fraudulento o no adecuado.
                    </li>
                    <li>Declaro que <strong>PCH SAN BARTOLOME SAS ESP</strong>, ha puesto en mi conocimiento, el derecho que poseo como titular de la información entregada, 
                        de recibir en cualquier momento información acerca del tratamiento dado a los datos entregados y/o de solicitar la actualización, 
                        rectificación y/o supresión de los datos personales recolectados o la revocatoria de la autorización otorgada, lo cual podré solicitar 
                        mediante un correo electrónico enviado a <strong>eticaycumplimiento@pch-sbo.com</strong> o una comunicación dirigida a la dirección: 
                        <strong>Calle 70 # 7-30</strong> Edificio Séptima Setenta de la ciudad de Bogotá.
                    </li>
                    <li>Conozco que <strong>PCH SAN BARTOLOME SAS ESP</strong>, cuenta con una politica de Protección de Datos Personales la cual podré solicitar 
                        a través del correo electrónico <strong>eticaycumplimiento@pch-sbo.com</strong>
                    </li>
                </ul>

                <p class="q-mt-md">
                    La presente autorización, se firma a los <strong>{{ dia }}</strong> días del mes de <strong>{{ mes }}</strong> del año <strong>{{ año }}</strong>
                </p>
                <p>Nombre del Representante Legal: <strong>{{ nombreRepresentante || '___________________' }}</strong></p>
                <p>Cédula de Ciudadanía: <strong>{{ numeroIdentificacion || '___________________' }}</strong></p>
            </q-card-section>

            <div class="q-mt-lg q-pa-md bg-grey-2 rounded-borders">
                <q-checkbox
                    v-model="firmaAceptadaDatosPersonales"
                    label="Firmo digitalmente este documento al marcar esta casilla"
                    color="primary"
                />
                <p>
                    Al aceptar, declaro que la información es verídica y doy mi consentimiento el {{ new Date().toLocaleDateString('es-CO') }} a las {{ new Date().toLocaleTimeString('es-CO') }}
                </p>

            </div>

            <q-card-actions align="right">
                <q-btn flat label="Cerrar y Firmar" color="primary" :disable="!firmaAceptadaDatosPersonales" @click="dialogDatos = false"/>
            </q-card-actions>

        </q-card>
    </q-dialog>

    <!-- Diálogo de autorización de conflictos de intereses -->
     <q-dialog v-model="dialogConflictos" @hide="onDialogConflictosClose">
        <q-card style="max-width: 700px; width: 100%; margin: auto;">
            <q-card-section class="bg-primary text-white">
                <div class="text-h6">Declaración de Conflictos de Intereses</div>
                <div class="text-subtitle2">PCH SAN BARTOLOMÉ SAS ESP</div>
            </q-card-section>
            <q-card-section style="max-height: 80vh; overflow-y: auto;">
                <p>
                    Yo, <strong>{{ nombreRepresentante || '___________________' }}</strong>,
                    en calidad de representante de <strong>{{ razonSocial || '___________________' }}</strong>,
                    identificado(a) con <strong>{{ tipoDocumentoRepresentante || '___________________' }}</strong> y <strong>{{ numeroIdentificacion || '___________________' }}</strong>,
                    actuando en nombre propio y/o en representación de mi empresa, declaro bajo la gravedad de juramento lo siguiente:
                </p>
                <ol class="q-ml-md">
                    <li class="text-weight-bold q-mt-md">Ausencia de Conflicto de Interés:</li>
                    <p>
                        Confirmo que, hasta la fecha, no existe ningún tipo de relación personal, financiera, laboral o de cualquier otra índole con empleados, representantes o accionistas de <strong>PCH SAN BARTOLOME SAS ESP</strong>,
                        que pueda generar un conflicto de intéres directo o indirecto en la relación comercial que mantenemos.
                    </p>
                    <li class="text-weight-bold q-mt-md">Declaración de Situaciones Potenciales:</li>
                    <p>
                        En caso de que en el futuro surja alguna situación que pueda ser considerada un conflicto de interés, 
                        me comprometo a notifcar de manera inmediata y por escrito a <strong>PCH SAN BARTOLOME SAS ESP</strong> para proceder a gestionar la situación según las políticas de la compañía.
                    </p>
                    <li class="text-weight-bold q-mt-md">Compromiso Ético</li>
                    <p>
                        Aseguro que todas las interacciones y transacciones realizadas entre <strong>{{ razonSocial || '___________________' }}</strong> y <strong>PCH SAN BARTOLOME SAS ESP</strong>
                        estarán alineados con principios éticos, legales y transparentes, buscando en todo momento la equidad y el beneficio mutuo.
                    </p>
                </ol>
                <p class="q-mt-md">
                    La presente autorización, se firma a los <strong>{{ dia }}</strong> días del mes de <strong>{{ mes }}</strong> del año <strong>{{ año }}</strong>
                </p>
                <p>Nombre del Representante Legal: <strong>{{ nombreRepresentante || '___________________' }}</strong></p>
                <p>Cédula de Ciudadanía: <strong>{{ numeroIdentificacion || '___________________' }}</strong></p>
            </q-card-section>

            <div class="q-mt-lg q-pa-md bg-grey-2 rounded-borders">
                <q-checkbox
                    v-model="firmaAceptadaConflictos"
                    label="Firmo digitalmente este documento al marcar esta casilla"
                    color="primary"
                />
                <p>
                    Al aceptar, declaro que la información es verídica y doy mi consentimiento el {{ new Date().toLocaleDateString('es-CO') }} a las {{ new Date().toLocaleTimeString('es-CO') }}
                </p>

            </div>

            <q-card-actions align="right">
                <q-btn flat label="Cerrar y Firmar" color="primary" :disable="!firmaAceptadaConflictos" @click="dialogConflictos = false"/>
            </q-card-actions>

        </q-card>
     </q-dialog>
</template>

<style scoped lang="scss">
*{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

</style>