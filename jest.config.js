module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  moduleNameMapper: { '\\.(md)$': '<rootDir>/__tests__/fixtures/asset.js' },
  clearMocks: true,
};
