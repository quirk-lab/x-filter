const path = require('node:path');

const jsdomProjects = new Set(['react', 'playground', 'antd', 'shadcn', 'web']);
const apps = new Set(['playground', 'web']);
const hasExplicitTestFile = process.argv.some(
  (arg) => arg.includes('/src/__tests__/') && /\.spec\.tsx?$/.test(arg)
);

const makeProject = (name) => {
  const isApp = apps.has(name);
  const rootDir = path.join(__dirname, isApp ? 'apps' : 'packages', name);
  const collectCoverageFrom = isApp
    ? []
    : [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**',
        '!src/**/*.spec.ts',
        '!src/**/*.spec.tsx',
        '!src/**/*.test.ts',
        '!src/**/*.test.tsx',
      ];

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
    collectCoverageFrom,
    coveragePathIgnorePatterns: ['/node_modules/'],
  };
};

module.exports = {
  collectCoverage: !hasExplicitTestFile,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
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
