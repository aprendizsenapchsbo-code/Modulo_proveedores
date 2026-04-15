<script setup>

function cerrarPestaña() {
    window.close();
}

</script>

<template>
    <div class="pantalla bg-grey-2" style="height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; border-radius: 12px; padding: 48px; max-width: 500px; width: 90%; text-align: center; border: 1px solid #ccc;">

            <!-- Ícono de éxito -->
            <q-icon name="check_circle" color="positive" size="80px" />

            <!-- Titulo -->
             <h1 class="text-h5 text-weight-bold text-secondary q-mt-md q-mb-sm">
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
                @click="cerrarPestaña()"
            />
        </div>
    </div>
</template>