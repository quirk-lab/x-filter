const path = require('path');

const jsdomProjects = new Set(['react', 'playground']);

const makeProject = (name) => ({
  displayName: name,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: jsdomProjects.has(name) ? 'jsdom' : 'node',
  rootDir: path.join(
    __dirname,
    jsdomProjects.has(name) ? 'apps' : 'packages',
    name === 'playground' ? 'playground' : name
  ),
  testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.ts?(x)'],
  globals: {
    'ts-jest': {
      useESM: true,
      tsconfig: path.join(
        __dirname,
        name === 'playground' ? 'apps/playground' : `packages/${name}`,
        'tsconfig.json'
      )
    }
  },
  moduleNameMapper: {
    '^@x-filter/(.*)$': '<rootDir>/../../packages/$1/src'
  },
  setupFilesAfterEnv: jsdomProjects.has(name)
    ? [path.join(__dirname, 'jest.setup.ts')]
    : [],
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: path.join(__dirname, 'coverage', name),
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95
    }
  }
});

module.exports = {
  collectCoverage: true,
  projects: [makeProject('core'), makeProject('utils'), makeProject('react'), makeProject('playground')]
};
