import { ref } from 'vue'

// Estado global del diálogo (una sola instancia en toda la app)
const open = ref(false)
const options = ref({})
let resolveFn = null

export function useConfirm() {
    function confirmar(opts = {}) {
        return new Promise((resolve) => {
        options.value = opts
        resolveFn = resolve
        open.value = true
        })
    }

    function handleResolve(ok) {
        open.value = false
        const fn = resolveFn
        resolveFn = null
        fn?.(!!ok)
    }

    return { confirmar, confirmOpen: open, confirmOptions: options, handleResolve }
}