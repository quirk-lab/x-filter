const path = require('node:path');

const jsdomProjects = new Set(['react', 'playground', 'antd', 'shadcn', 'web']);
const apps = new Set(['playground', 'web']);

const makeProject = (name) => {
  const isApp = apps.has(name);
  const rootDir = path.join(__dirname, isApp ? 'apps' : 'packages', name);

  return {
    displayName: name,
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: jsdomProjects.has(name) ? 'jsdom' : 'node',
    rootDir,
    testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.ts?(x)'],
    moduleNameMapper: {
      '^@x-filter/(.*)$': path.join(__dirname, 'packages/$1/src'),
    },
    setupFilesAfterEnv: jsdomProjects.has(name) ? [path.join(__dirname, 'jest.setup.ts')] : [],
    coveragePathIgnorePatterns: ['/node_modules/'],
  };
};

module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
  projects: [
    makeProject('core'),
    makeProject('utils'),
    makeProject('react'),
    makeProject('playground'),
    makeProject('antd'),
    makeProject('shadcn'),
    makeProject('web'),
  ],
};

