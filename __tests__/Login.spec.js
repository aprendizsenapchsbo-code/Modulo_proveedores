import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount } from "@vue/test-utils";
import { setActivePinia } from "pinia";
import { createTestingPinia } from '@pinia/testing';
import { flushPromises } from "@vue/test-utils";

const { mockPost, mockExitoNotify, mockErrorNotify, mockPush } = vi.hoisted(() => {
  return {
    mockPost: vi.fn(),
    mockExitoNotify: vi.fn(),
    mockErrorNotify: vi.fn(),
    mockPush: vi.fn(),
  };
});

// ---------- 2. Mock de localStorage (global) ----------
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}));
global.localStorage = localStorageMock;

// ---------- 3. vi.mock con factories que usan las variables hoisted ----------
// Mock de Quasar
vi.mock('quasar', () => ({
  QForm: {
    template: '<form @submit="$emit(\'submit\', $event)"><slot /></form>',
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
    props: ['modelValue', 'type', 'label', 'filled', 'lazyRules', 'rules'],
  },
  QBtn: {
    name: 'QBtn',
    template: `
      <button type="submit" :disabled="loading" class="botonLogin">
        {{ label }}
        <slot></slot>
      </button>`,
    props: ['loading', 'type', 'label'],
  },
  QIcon: {
    name: 'QIcon',
    template: '<span @click="$emit(\'click\')">{{ name }}</span>',
    props: ['name'],
    emits: ['click'],
  },
}));

// Mock de axios (usando mockPost)
vi.mock('../src/services/axios.js', () => ({
  default: { post: mockPost },
}));

// Mock de Notify (usando mockExitoNotify y mockErrorNotify)
vi.mock('../src/composables/Notify.js', () => ({
  exitoNotify: mockExitoNotify,
  errorNotify: mockErrorNotify,
}));

// Mock de vue-router (usando mockPush y mockRoute)
const mockRoute = { query: {} };
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => mockRoute),
  useRouter: vi.fn(() => ({ push: mockPush })),
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
        },
      });
    }

    beforeEach(() => {
        // Reiniciar mocks
        vi.clearAllMocks();
        mockRoute.query = {};
        localStorageMock.clear();
        // Montamos el componente fresco para cada prueba
        wrapper = mountLogin();
    });

    afterEach(() => {
        wrapper?.unmount(); 
    });

    // 3. Pruebas
    it('renderiza correctamente el formulario', () => {
        expect(wrapper.find('input[type="email"]').exists()).toBe(true);
        expect(wrapper.find('input[type="password"]').exists()).toBe(true);
        expect(wrapper.find('button[type="submit"]').text()).toContain('Iniciar Sesión');
    });

    it('realiza login exitoso', async () => {
      const respuesta = { data: { usuario: { nombre: 'Juan' }, token: 'abc' } };
      mockPost.mockResolvedValueOnce(respuesta);

      await wrapper.find('input[type="email"]').setValue('juan@gmail.com');
      await wrapper.find('input[type="password"]').setValue('123456');
      await wrapper.find('form').trigger('submit');

      await new Promise(setTimeout);

      expect(mockPost).toHaveBeenCalledWith('api/usuario/login', {
        email: 'juan@gmail.com',
        password: '123456',
      });
      const store = useUsuarioStore();
      expect(store.setUsuario).toHaveBeenCalledWith(respuesta.data.usuario);
      expect(store.setToken).toHaveBeenCalledWith(respuesta.data.token);
      expect(mockExitoNotify).toHaveBeenCalledWith('¡Bienvenido, Juan!');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('maneja error de credenciales', async () => {
      const mensajeError = 'Credenciales inválidas';
      mockPost.mockRejectedValueOnce({ response: { data: { msg: mensajeError } } });

      await wrapper.find('input[type="email"]').setValue('juan@gmail.com');
      await wrapper.find('input[type="password"]').setValue('wrong');
      await wrapper.find('form').trigger('submit');

      await new Promise(setTimeout);

      expect(mockErrorNotify).toHaveBeenCalledWith(mensajeError);
      const store = useUsuarioStore();
      expect(store.setUsuario).not.toHaveBeenCalled();
      expect(store.setToken).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('muestra estado de carga', async () => {
      let resolver;
      mockPost.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));

      await wrapper.find('input[type="email"]').setValue('juan@gmail.com');
      await wrapper.find('input[type="password"]').setValue('123456');

      // Llamar directamente a login() sin pasar por el evento del form
      const loginPromise = wrapper.vm.login();
  
      // Esperar a que todas las promesas pendientes se resuelvan
      await new Promise(r => queueMicrotask(r)); 
      
      // Verificar directamente la variable 'loading' en el componente
      expect(wrapper.vm.loading).toBe(true);
      expect(mockPost).toHaveBeenCalled(); 

      // Resolver la promesa para limpiar
      resolver({ data: { usuario: {}, token: '' } });
      await flushPromises();
    });

    it('alterna visibilidad de contraseña', async () => {
      const icono = wrapper.find('span');
      await icono.trigger('click');
      const inputText = wrapper.find('input[type="text"]');
      expect(inputText.exists()).toBe(true);

      // Hacer click de nuevo para volver a password
      await icono.trigger('click');
      const inputPassword = wrapper.find('input[type="password"]');
      expect(inputPassword.exists()).toBe(true);
    });
});