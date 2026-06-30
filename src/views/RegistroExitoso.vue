<script setup>
import logo from '../assets/img/Logo_login.png'

function cerrarPestaña() {
    // Redirigir a la página principal de WordPress (o a la que corresponda)
    window.location.href = 'https://www.proveedor.pch-sbo.com';
}

</script>

<template>
    <div class="pantalla bg-grey-2" style="height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; padding: 48px; max-width: 500px; width: 90%; text-align: center; border: 1px solid #ccc; display: flex; justify-content: center; align-items: center; flex-direction: column;">
            <!-- Imagen de coorporativa -->
            <img :src="logo" alt="Imagen coorporativa">

            <!-- Ícono de éxito -->
            <!-- <q-icon name="check_circle" color="positive" size="80px" /> -->

            <!-- Titulo -->
             <h1 class="text-h5 text-weight-bold text-secondary q-mt-sm q-mb-sm">
                ¡Registro completado exitosamente!
            </h1>

            <!-- Mensaje -->
            <p class="text-body1 text-grey-6 q-mb-lg">
                Su información ha sido enviada correctamente. Pronto recibirá un correo con la confirmación de su registro como proveedor de <strong>PCH San Bartolomé</strong>.
            </p>

            <!-- Botón -->
            <q-btn
                label="Aceptar"
                color="primary"
                size="lg"
                style="width: 100%;"
                @click="cerrarPestaña"
            />
        </div>
    </div>
</template>