import { vi } from 'vitest';

// Mock de localStorage para el entorno de pruebas
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Si usas sessionStorage, también mockéalo
global.sessionStorage = { ...localStorageMock };