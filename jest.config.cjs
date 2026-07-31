module.exports = {
    testEnvironment: 'jsdom',
    transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['vue', 'js', 'json', 'jsx', 'ts', 'tsx', 'node'],
  transformIgnorePatterns: [
    'node_modules/(?!(quasar|@quasar|vue-router|pinia|@pinia)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  testMatch: [
    '**/__tests__/**/*.spec.js',
    '**/*.test.js',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}