<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUsuarioStore } from '../stores/usuario';

const router = useRouter()
const usuarioStore = useUsuarioStore()

onMounted(() => {
    console.log('Usuario en store:', usuarioStore.usuario);
    console.log('Rol:', usuarioStore.usuario?.rol);
})

const model = ref(null)
const optionsTipo = [
        'Servicio', 'Bien', 'Servicio/Bien'
      ]
const optionsEstado = [
        'Actualizado', 'Pendiente Actualización', 'Incativo'
      ]

function logout() {
    usuarioStore.clearUsuario();
    usuarioStore.clearToken();
    router.push('/')

    console.log("Sesión cerrada");
    
}
</script>

<template>
    <div class="pantallaProveedores">
            <section class="contenidoHeader">
                <div class="header">
                    <div class="rol-admin">
                        <span class="bg-secondary text-white q-px-md q-py-sm rounded-borders">{{ usuarioStore.usuario?.nombre }} - {{ usuarioStore.usuario?.rol }} </span>
                    </div>
                    <div class="btn-logout">
                        <q-btn 
                        @click="logout" 
                        class="logout bg-clear" 
                        label="Cerrar sesión" />
                    </div>
                </div>
            </section>
            
        <div class="contenido">
            <section class="estadisticas q-mt-lg">
                <div class="box1 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">TOTAL PROVEEDORES</span>
                        <div class="cuadritoAzul q-mr-md " style="width: 25px; height: 20px; background-color: #D7E8FF; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">128</span>
                        <span class="porcentajeMensual text-primary">12% este mes</span>
                    </div>
                </div>
                <div class="box2 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">PENDIENTE DE ACTUALIZACION</span>
                        <div class="cuadritoAzul q-mr-md " style="width: 25px; height: 20px; background-color: #FEE8A6; border-radius: 5px;"></div>
                    </div>

                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">14</span>
                        <span class="porcentajeMensual" style="color: #F8C837;">Requiere atención inmediata</span>
                    </div>
                </div>
                <div class="box3 text-body2 q-pl-md q-pt-md">
                    <div class="contenido1">
                        <span class="text-grey-5">CUMPLIMIENTO GENERAL</span>
                        <div class="cuadritoAzul q-mr-md " style="width: 25px; height: 20px; background-color: #6BBB6B; border-radius: 5px;"></div>
                    </div>
    
                    <div class="contenido2">
                        <span class="numeroTotalProveedores text-h5 text-bold">89%</span>
                        <span class="porcentajeMensual text-grey-5">Requiere atención inmediata</span>
                    </div>
                </div>
            </section>

            <section class="filtros q-mt-lg">
                <div class="inputBusqueda">
                    <q-input 
                    outlined 
                    v-model="text" 
                    label="🔍 Buscar proveedor" 
                    class="q-pl-md rounded-borders" 
                    />
                </div>

                <div class="filtroTipo">
                    <q-select 
                    class="selectTipo"
                    outlined 
                    v-model="model" 
                    :options="optionsTipo" 
                    label="Tipo" 
                    />
                </div>

                <div class="filtroEstado">
                    <q-select 
                    class="selectEstado"
                    outlined 
                    v-model="model" 
                    :options="optionsEstado" 
                    label="Estado" 
                    />
                </div>
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

.filtros .filtroTipo  .selectTipo :deep(.q-field__control) {
    border-radius: 12px;
}

.filtros .filtroEstado {
    width: 150px;
}

.filtros .filtroEstado .selectEstado :deep(.q-field__control) {
    border-radius: 12px;
}
</style>