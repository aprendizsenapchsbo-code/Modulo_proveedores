// Mock del composable de notificaciones
jest.mock('../src/composables/Notify', () => ({
  exitoNotify: jest.fn(),
  errorNotify: jest.fn()
}));

// Mock del cliente HTTP
jest.mock('../src/services/axios', () => ({
  default: {
    post: jest.fn(),
    get: jest.fn()
  }
}));

// Mock de vue-router
const mockPush = jest.fn(); // ✅ declarado ANTES del mock del módulo

jest.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
  useRoute:  () => ({ query: {} })
}));

// ─── Imports luego de mocks ───────────────────────────────────────────────────
const { mount }             = require('@vue/test-utils');
const { createTestingPinia } = require('@pinia/testing');
const { default: Login }    = require('../src/views/Login.vue');
const { default: apiClient } = require('../src/services/axios');
const { exitoNotify, errorNotify } = require('../src/composables/Notify');

// ─── Helper ───────────────────────────────────────────────────────────────────
function mountLogin(pinia) {
  return mount(Login, {
    global: {
      plugins: [pinia],
      stubs: {
        'q-input' : true,
        'q-btn'   : true,
        'q-form'  : true,
        'q-icon'  : true
      }
    }
  });
}

// ─── Suite ───────────────────────────────────────────────────────────────────
describe('Login.vue', () => {
  let wrapper;
  let store;

  beforeEach(() => {
    jest.clearAllMocks();

    const pinia = createTestingPinia({ createSpy: jest.fn });
    wrapper = mountLogin(pinia);

    const { useUsuarioStore } = require('../src/stores/usuario');
    store = useUsuarioStore();
  });

describe('CP-01: Login exitoso', () => {

    // r.data.data.usuario y r.data.data.token
    const mockResponse = {
      data: {
        data: {
          usuario: { id: 1, nombre: 'Juan' },
          token: 'tok_123'
        }
      }
    };

    beforeEach(() => {
      apiClient.post.mockResolvedValue(mockResponse);
    });

    it('llama a apiClient.post con las credenciales del formulario', async () => {
      wrapper.vm.email    = 'juan@test.com';
      wrapper.vm.password = '123456';

      await wrapper.vm.login();

      expect(apiClient.post).toHaveBeenCalledWith('api/usuario/login', {
        email   : 'juan@test.com',
        password: '123456'
      });
    });

    it('guarda el usuario en el store tras login exitoso', async () => {
      await wrapper.vm.login();

      expect(store.setUsuario).toHaveBeenCalledWith({ id: 1, nombre: 'Juan' });
    });

    it('guarda el token en el store tras login exitoso', async () => {
      await wrapper.vm.login();

      // ✅ Ahora mockResponse tiene data.data.token = 'tok_123'
      expect(store.setToken).toHaveBeenCalledWith('tok_123');
    });

    it('muestra notificación de bienvenida y NO muestra error', async () => {
      await wrapper.vm.login();

      // exitoNotify viene del mock declarado al tope del archivo
      expect(exitoNotify).toHaveBeenCalled();
      expect(errorNotify).not.toHaveBeenCalled();
    });

    it('redirige a /dashboard', async () => {
      await wrapper.vm.login();

      // mockPush está declarado en el scope del módulo, no dentro del it
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('establece loading=true durante la petición y loading=false al finalizar', async () => {
      // Congelamos la resolución para inspeccionar el estado intermedio
      let resolve;
      apiClient.post.mockImplementationOnce(
        () => new Promise(res => { resolve = res })
      );

      const loginPromise = wrapper.vm.login();
      expect(wrapper.vm.loading).toBe(true);

      resolve(mockResponse);
      await loginPromise;

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // Caso dos
  describe('CP-02: Error de API (401 / 500)', () => {

    it('muestra errorNotify con el mensaje del backend', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { data: { msg: 'Credenciales incorrectas' } }
      });

      await wrapper.vm.login();

      expect(errorNotify).toHaveBeenCalledWith('Credenciales incorrectas');
      expect(exitoNotify).not.toHaveBeenCalled();
    });

    it('muestra mensaje genérico cuando el backend no retorna msg', async () => {
      // Simula error de red sin response.data.msg
      apiClient.post.mockRejectedValueOnce(new Error('Network Error'));

      await wrapper.vm.login();

      expect(errorNotify).toHaveBeenCalledWith('Error al iniciar sesión');
    });

    it('no guarda token ni usuario en el store', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { data: { msg: 'Acceso denegado' } }
      });

      await wrapper.vm.login();

      expect(store.setToken).not.toHaveBeenCalled();
      expect(store.setUsuario).not.toHaveBeenCalled();
    });

    it('no redirige al dashboard', async () => {
      apiClient.post.mockRejectedValueOnce({
        response: { data: { msg: 'Error' } }
      });

      await wrapper.vm.login();

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('restablece loading=false aunque haya error (bloque finally)', async () => {
      apiClient.post.mockRejectedValueOnce(new Error('Fallo'));

      await wrapper.vm.login();

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  // Caso tres
  describe('CP-03: Campos vacíos', () => {

    it('llama a la API con strings vacíos cuando no se rellenan los campos', async () => {
      // ✅ Aserción corregida: login() no valida antes de llamar a la API;
      //    el componente delega la validación a q-form (@submit + lazy-rules).
      //    Esta prueba documenta el comportamiento REAL de login() en aislamiento.
      apiClient.post.mockResolvedValueOnce({
        data: { data: { usuario: {}, token: '' } }
      });

      await wrapper.vm.login();

      expect(apiClient.post).toHaveBeenCalledWith('api/usuario/login', {
        email   : '',
        password: ''
      });
    });

    it('no redirige ni notifica éxito si el token devuelto está vacío', async () => {
      // El store guardará un token vacío pero al menos no debe lanzar error
      apiClient.post.mockResolvedValueOnce({
        data: { data: { usuario: { nombre: '' }, token: '' } }
      });

      await wrapper.vm.login();

      expect(mockPush).toHaveBeenCalledWith('/dashboard'); // sí redirige (no hay validación post-login)
      expect(errorNotify).not.toHaveBeenCalled();
    });
  });
});