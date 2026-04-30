/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  
  // Extensiones que Jest debe reconocer
  moduleFileExtensions: [
    "js",
    "json",
    "vue",
    "cjs",
    "mjs"
  ],

  roots: ["<rootDir>/test"], // Dile a Jest que busque aquí
  testMatch: [
    "**/?(*.)+(spec|test).?[jt]s?(x)", // Patrones estándar
    "**/?(*.)+(spec|test).cjs"         // Asegura que encuentre .cjs
  ],

  transform: {
    // 1. Vue files son procesados por vue3-jest (que usa babel internamente)
    "^.+\\.vue$": "@vue/vue3-jest",
    
    // 2. JS files: Usamos babel-jest, pero con cuidado.
    // Si el error persiste, prueba comentando esta línea temporalmente 
    // para ver si el problema es solo con los .vue
    "^.+\\.js$": "babel-jest"
  },

  // Evita que Jest transforme node_modules, excepto librerías clave de Vue/Router
  transformIgnorePatterns: [
    "/node_modules/(?!(@vue/test-utils|@vue/vue3-jest|vue-router)/)"
  ],

  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1"
  },

  clearMocks: true,
};

module.exports = config;