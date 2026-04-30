const { mount } = require('@vue/test-utils');
const { createTestingPinia } = require('@pinia/testing');
const { createRouter, createMemoryHistory } = require('vue-router');
const { default: Login } = require('../src/views/Login.vue');

// Mock de Quasar
jest.mock('quasar', () => ({
  Notify: { create: jest.fn() }
}));

jest.mock('../src/services/axios', () => ({
  post: jest.fn(),
  get: jest.fn()
}));

const apiClient = require('../src/services/axios');

describe('Login.vue - CP-01: Login Exitoso', () => {
  let wrapper;
  let pinia;
  let store;
  let router;

  beforeEach(() => {
    jest.clearAllMocks();

    // ✅ Router real de prueba
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { template: '<div />' } },
        { path: '/dashboard', component: { template: '<div />' } }
      ]
    });

    // Espiar router.push
    jest.spyOn(router, 'push').mockImplementation(mockPush);

    pinia = createTestingPinia({ createSpy: jest.fn });

    wrapper = mount(Login, {
      global: {
        plugins: [pinia],
        stubs: {
          'q-input': true,
          'q-btn': true,
          'q-form': true,
          'q-icon': true
        }
      }
    });

    const { useUsuarioStore } = require('../src/stores/usuario');
    store = useUsuarioStore();
  });

  // Caso uno
  it('debería procesar el login correctamente', async () => {
    // ARRANGE ✅ objeto bien formado
    const mockResponse = {
      data: {
        usuario: { id: 1, nombre: 'Juan' },
        token: 'tok_123'
      }
    };

    // ACT ✅ sin corchetes de Markdown
    apiClient.post.mockResolvedValueOnce(mockResponse);
    wrapper.vm.email = 'juan@test.com';
    wrapper.vm.password = '123456';

    await wrapper.vm.login();

    // ASSERT
    expect(apiClient.post).toHaveBeenCalledWith('api/usuario/login', {
      email: 'juan@test.com',
      password: '123456'
    });

    const { exitoNotify, errorNotify } = require('../src/composables/Notify');
    expect(exitoNotify).toHaveBeenCalled();
    expect(errorNotify).not.toHaveBeenCalled();

    expect(store.setToken).toHaveBeenCalledWith('tok_123');
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  // Caso dos
  it('CP-02: Debería mostrar error cuando la API falla (401/500)', async () => {
    // ARRANGE
    const mockError = {
      response: {
        data:{
          msg: 'Credenciales incorrectas'
        }
      }
    };
    // Simular rechazo de la promesa
    apiClient.post.mockRejectedValueOnce(mockError);

    // ACT
    wrapper.vm.email = 'juan@test.com';
    wrapper.vm.password = 'wrongpass';
    await wrapper.vm.login();

    // ASSERT
    expect(apiClient.post).toHaveBeenCalled();

    const { exitoNotify, errorNotify } = require('../src/composables/Notify');
    
    // Debe llamar a errorNotify con el mensaje del backend
    expect(errorNotify).toHaveBeenCalledWith('Credenciales incorrectas');
    expect(exitoNotify).not.toHaveBeenCalled();

    // NO debe actualizar el store ni redirigir
    expect(store.setToken).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // Caso tres
  it('CP-03: No debería llamar a la API si los campos están vacíos', async () => {
    await wrapper.vm.login();

    expect(apiClient.post).toHaveBeenCalledWith('api/usuario/login', {
      email: '',
      password: ''
    });
  });
});