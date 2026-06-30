import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia } from "pinia";
import { createTestingPinia } from '@pinia/testing';

// Mock de Quasar antes de importar la vista
vi.mock('quasar', () => ({
    QForm: { template: '<form @submit.prevent="$emit(\'submit\')"><slot /></form>' },
    QInput: {
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
      props: ['modelValue', 'type', 'label', 'filled', 'lazyRules', 'rules'],
  },
  QBtn: {
      template: '<button type="submit" :disabled="loading"><slot /></button>',
      props: ['loading', 'type'],
},
QIcon: {
    template: '<span @click="$emit(\'click\')">{{ name }}</span>',
    props: ['name'],
},
}));
// 1. Mocks de dependencias externas

// Mock de apiClient (axios)
const mockPost = vi.fn();
vi.mock('../src/services/axios.js', () => ({
    default: {
        post: mockPost,
    },
}));

// Mock de notificaciones
const mockExitoNotify = vi.fn();
const mockErrorNotify = vi.fn();
vi.mock('../src/composables/Notify.js', () => ({
    exitoNotify: mockExitoNotify,
    errorNotify: mockErrorNotify,
}));

// Mock de vue-router
const mockPush = vi.fn();
const mockRoute = { query: {} };
vi.mock('vue-router', () => ({
    useRoute: vi.fn(() => mockRoute),
    useRouter: vi.fn(() => ({
        push: mockPush,
    })),
}));

import Login from "../src/views/Login.vue";
import { useUsuarioStore } from "../src/stores/usuario.js";
// 2. Casos de prueba

describe('Login.vue', () => {
    let wrapper;

    // Helper para montar el componente con stubs (opcional, pero útil)
    function mountLogin() {
        const pinia = createTestingPinia({
        stubActions: false,
        initialState: {
            usuario: { usuario: null, token: null },
        },
        });
        setActivePinia(pinia);

        return mount(Login, {
        global: {
            plugins: [pinia],
            stubs: {
            'q-form': true,
            'q-input': true,
            'q-btn': true,
            'q-icon': true,
            },
        },
        });
    }

    beforeEach(() => {
        // Reiniciar mocks
        vi.clearAllMocks();
        mockRoute.query = {};
        // Montamos el componente fresco para cada prueba
        wrapper = mountLogin();
    });

    afterEach(() => {
        wrapper?.unmount(); 
    });

    // 3. Pruebas
    it('renderiza correctamente el formulario', () => {
        wrapper = mountLogin();
        expect(wrapper.find('input[type="email"]').exists()).toBe(true);
        expect(wrapper.find('input[type="password"]').exists()).toBe(true);
        expect(wrapper.find('button[type="submit"]').text()).toContain('Iniciar Sesión');
    });
})