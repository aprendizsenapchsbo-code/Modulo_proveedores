<template>
    <q-dialog
        :model-value="modelValue"
        :persistent="opts.persistent !== false"
        transition-show="scale"
        transition-hide="scale"
        @hide="settle(false)"
    >
        <q-card class="confirm-card" :style="cssVars">
            <div class="confirm-stage">
                <div class="confirm-ring" aria-hidden="true"></div>
                <div class="confirm-icon-wrap">
                <q-icon :name="opts.icon || 'priority_high'" class="confirm-icon" />
                </div>
                <div class="confirm-title">{{ opts.title || 'Confirmar acción' }}</div>
            </div>

            <q-card-section class="confirm-body">
                <p class="confirm-message">
                {{ opts.message || '¿Estás seguro de que deseas continuar?' }}
                </p>

                <div v-if="opts.subject" class="confirm-subject">
                <q-icon name="label_important" size="18px" class="confirm-subject-icon" />
                <span class="confirm-subject-text">{{ opts.subject }}</span>
                </div>

                <p v-if="opts.hint" class="confirm-hint">{{ opts.hint }}</p>
            </q-card-section>

            <q-card-actions align="right" class="confirm-actions">
                <q-btn
                flat no-caps autofocus
                :label="opts.cancelLabel || 'Cancelar'"
                class="confirm-cancel"
                @click="settle(false)"
                />
                <q-btn
                unelevated no-caps
                :label="opts.confirmLabel || 'Confirmar'"
                :icon="opts.confirmIcon || ''"
                class="confirm-ok"
                @click="settle(true)"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
    modelValue: { type: Boolean, default: false },
    options:    { type: Object,  default: () => ({}) }
})
const emit = defineEmits(['resolve'])

const opts = computed(() => props.options || {})

const palette = {
    danger:  { main: '#C62828', soft: '#FDECEA', ring: 'rgba(198,40,40,.22)' },
    warning: { main: '#B7791F', soft: '#FBF3E0', ring: 'rgba(183,121,31,.22)' },
    info:    { main: '#3454D1', soft: '#E7ECFB', ring: 'rgba(52,84,209,.22)' }
}
const cssVars = computed(() => {
    const t = palette[opts.value.tone] || palette.danger
    return { '--tone': t.main, '--tone-soft': t.soft, '--tone-ring': t.ring }
})

// Resuelve la promesa una sola vez por apertura
const settled = ref(false)
watch(() => props.modelValue, (v) => { if (v) settled.value = false })
function settle(ok) {
    if (settled.value) return
    settled.value = true
    emit('resolve', ok)
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&display=swap');

$display: 'Sora', 'Segoe UI', system-ui, sans-serif;
$body: system-ui, -apple-system, 'Segoe UI', sans-serif;
$verde-claro: #DAEAD0;
$verde-oscuro: #142808;

.confirm-card {
    width: 100%; max-width: 460px; border-radius: 22px; overflow: hidden;
    border: 1px solid $verde-claro; box-shadow: 0 24px 60px rgba(20,40,8,.22);
    font-family: $body;
}

.confirm-stage {
    position: relative; display: flex; flex-direction: column; align-items: center;
    gap: 14px; padding: 30px 24px 22px; overflow: hidden;
    background: radial-gradient(120% 120% at 50% -10%, var(--tone-soft) 0%, #fff 70%);
}
.confirm-ring {
    position: absolute; top: 30px; width: 72px; height: 72px; border-radius: 50%;
    background: var(--tone-ring); animation: ring-pulse 2.4s ease-out infinite;
}
.confirm-icon-wrap {
    position: relative; z-index: 1; width: 72px; height: 72px; border-radius: 50%;
    display: grid; place-items: center; background: var(--tone-soft); color: var(--tone);
    box-shadow: 0 8px 20px var(--tone-ring);
    animation: icon-pop .45s cubic-bezier(.18,.89,.32,1.28) both;
}
.confirm-icon { font-size: 34px; }
.confirm-title {
    position: relative; z-index: 1; font-family: $display; font-weight: 800;
    font-size: 1.35rem; letter-spacing: -.5px; color: $verde-oscuro;
    text-align: center; line-height: 1.15;
}

.confirm-body { padding: 4px 26px 6px; text-align: center; }
.confirm-message { margin: 0; font-size: .95rem; line-height: 1.6; color: #3a4a30; }
.confirm-subject {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    margin: 16px auto 4px; padding: 10px 14px; background: var(--tone-soft);
    border-left: 4px solid var(--tone); border-radius: 10px;
}
.confirm-subject-icon { color: var(--tone); flex: 0 0 auto; }
.confirm-subject-text {
    font-family: $display; font-weight: 700; font-size: .95rem;
    color: $verde-oscuro; word-break: break-word;
}
.confirm-hint { margin: 12px 0 0; font-size: .8rem; color: #6b7a60; line-height: 1.5; }

.confirm-actions { padding: 14px 20px 20px; gap: 10px; }
.confirm-cancel {
    color: #5a6b50; font-weight: 600; border-radius: 12px;
    transition: background-color .2s ease;
    &:hover { background-color: rgba(218,234,208,.5); }
}
.confirm-ok {
    background: var(--tone); color: #fff; font-weight: 700; border-radius: 12px;
    padding: 8px 20px; box-shadow: 0 6px 16px var(--tone-ring);
    transition: transform .15s ease, box-shadow .2s ease, filter .2s ease;
    &:hover { transform: translateY(-2px); box-shadow: 0 10px 22px var(--tone-ring); filter: brightness(1.05); }
    &:active { transform: translateY(0); }
}

@keyframes icon-pop { 0% { transform: scale(.4); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
@keyframes ring-pulse { 0% { transform: scale(.85); opacity: .8; } 70%,100% { transform: scale(1.5); opacity: 0; } }
</style>