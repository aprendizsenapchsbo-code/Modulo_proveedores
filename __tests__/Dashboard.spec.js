import { ref } from "vue";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia } from "pinia";
import { createTestingPinia } from "@pinia/testing";

// HOIST: Definir mocks de funciones compartidas
const {
    mockGet,
    mockPost,
    mockPut,
    mockDelete,
    mockExitoNotify,
    mockErrorNotify,
    mockPush
} = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockDelete: vi.fn(),
    mockExitoNotify: vi.fn(),
    mockErrorNotify: vi.fn(),
    mockPush: vi.fn(),
}));

// Mock de localstorage (global)
const localStorageMock = vi.hoisted(() => ({
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}));
global.localStorage = localStorageMock;

// Mock del composable useProveedorPaginados
const mockProveedoresPaginados = vi.hoisted(() => ({
    proveedores: ref([]),
    loading: ref(false),
    hasMore: ref(true),
    nextSkipToken: ref(null),
    cargarPagina: vi.fn(),
    cargarSiguiente: vi.fn(),
    recargar: vi.fn(),
}));

// Mock de Quasar
vi.mock('quasar', () => ({
    QForm: {
        template: `<form @submit="$emit(\'submit\', $event)"><slot/></form>`,
    },
    QInput: {
        name: 'QInput',
        template: `
            <div>
                <input
                    :value="modelValue"
                    @input="$emit('update:modelValue', $event.target.value)"
                    :type="type"
                    :placeholder="label"
                />
                <slot name="append"></slot>
            </div>
        `,
        props: ['modelValue', 'type', 'lable', 'filled', 'lazyRules', 'rules'],
    },
    QBtn: {
        name: 'QBtn',
        template: `
            <button type="submit" :disabled="loading" class="botonLogin">
                {{ label }}
                <slot></slot>
            </button>
        `,
        props: ['loading', 'type', 'label'],
    },
    QIcon: {
        name: 'QIcon',
        template: '<span @click="$emit(\'click\')">{{ name }}</span>',
        props: ['name'],
    },
    QBadge: {
        name: 'QBadge',
        template: '<span :class="color"><slot /></span>',
        props: ['color', 'textColor'],
    },
    QTable: {
        name: 'QTable',
        template: `
            <div>
                <table>
                    <thead><tr><th v-for="col in columns" :key="col.name">{{ col.label }}</th></tr></thead>
                    <tbody>
                        <tr v-for="row in rows" :key="row.NIT">
                            <td v-for="col in columns" :key="col.name">
                                <slot :name="'body-cell-' + col.name" :row="row" :col="col">
                                    {{ row[col.field] }}
                                </slot>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="loading">Cargando...</div>
                <div v-if="!rows.length && !loading">No hay datos disponibles</div>
            </div>
        `,
        props: ['rows', 'columns', 'loading', 'title', 'virtualScroll', 'rowKey'],
    },
    QTd: {
        name: 'QTd',
        template: '<td><slot /></td>',
        props: ['props']
    },
    QSelect: {
        name: 'QSelect',
        template: `
            <div>
                <select :value="modelValue" @input="$emit('update:modelValue', $event.target.value)">
                    <option v-for="opt in options" :key="opt" :value="opt">{{ opt }}</option>
                </select>
            </div>
        `,
        props: ['modelValue', 'options', 'label', 'outlined', 'clearable'],
    },
    QDialog: {
        name: 'QDialog',
        template: `
            <div v-if="modelValue">
                <slot />
                <button @click="$emit('update:modelValue', false)">Cerrar</button>
            </div>
        `,
        props: ['modelValue', 'persistent'],
    },
    QCard: {
        name: 'QCard',
        template: '<div><slot /></div>',
    },
    QCardSection: {
        name: 'QCardSection',
        template: '<div><slot /></div>',
    },
    QCardActions: {
        name: 'QCardActions',
        template: '<div><slot /></div>',
    },
    QSeparator: {
        name: 'QSeparator',
        template: '<hr />',
    },
    QList: {
        name: 'QList',
        template: '<ul><slot /></ul>',
    },
    QItem: {
        name: 'QItem',
        template: '<li><slot /></li>',
    },
    QItemSection: {
        name: 'QItemSection',
        template: '<div><slot /></div>',
    },
    QItemLabel: {
        name: 'QItemLabel',
        template: '<span><slot /></span>',
    },
    QFile: {
        name: 'QFile',
        template: `
            <div>
                <input type="file" @change="$emit('update:modelValue', $event.target.files)" multiple />
            </div>
        `,
        props: ['modelValue', 'multiple', 'outlined', 'label', 'accept'],
    },
    QTooltip: {
        name: 'QTooltip',
        template: '<span><slot /></span>',
    },
    QBtnGroup: {
        name: 'QBtnGroup',
        template: '<div><slot /></div>',
    },
}));

// Mocks de dependencias
vi.mock('../src/services/axios.js', () => ({
    default: {
        get: mockGet,
        post: mockPost,
        put: mockPut,
        delete: mockDelete,
    },
}));

vi.mock('../src/composables/Notify.js', () => ({
    exitoNotify: mockExitoNotify,
    errorNotify: mockErrorNotify,
}));

vi.mock('../src/composables/useProveedorPaginado.js', () => ({
    useProveedoresPaginados: vi.fn(() => mockProveedoresPaginados),
}));

// Mock del store de proveedor (aunque no se usa directamente en el componente, se importa)
vi.mock('../src/stores/proveedor.js', () => ({
    useProveedorStore: vi.fn(() => ({
        setTokenRegistro: vi.fn(),
    })),
}));

// Mock del router
const mockRoute = { query: {} };
vi.mock('vue-router', () => ({
    useRoute: vi.fn(() => mockRoute),
    useRouter: vi.fn(() => ({ push: mockPush })),
}));

// Importación del componente
import Dashboard from "../src/views/Dashboard.vue";
import { useUsuarioStore } from "../src/stores/usuario.js";

// Suite de pruebas
describe('Dashboard.vue', () => {
    let wrapper;

    // Helper para montar el componente
    function mountDashboard() {
        const pinia = createTestingPinia({
            stubActions: false,
            initialState: {
                usuario: {
                    usuario: { nombre: 'Admin', rol: 'Administrador' },
                    token: 'fake-token'
                },
            },
        });
        setActivePinia(pinia);

        return mount(Dashboard, {
            global: {
                plugins: [pinia],
            },
        });
    }

    beforeEach(() => {
        vi.clearAllMocks();
        mockRoute.query = {};
        localStorageMock.clear();
        // Resetear el mock del composable a valores por defecto
        mockProveedoresPaginados.proveedores.value = [];
        mockProveedoresPaginados.loading.value = false;
        mockProveedoresPaginados.hasMore.value = true;
        mockProveedoresPaginados.nextSkipToken.value = null;
        mockProveedoresPaginados.cargarPagina.mockClear();
        mockProveedoresPaginados.cargarSiguiente.mockClear();
        mockProveedoresPaginados.recargar.mockClear();

        // Mock de window.config para las pruebas de eliminación
        global.confirm = vi.fn(() => true);
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    // Pruebas
    // 1. Renderizado y Estructura
    describe('Renderizado y estructura', () => {
        it('El componente se renderiza sin errores', () => {
            wrapper = mountDashboard();
            expect(wrapper.exists()).toBe(true);
        });
    })
})