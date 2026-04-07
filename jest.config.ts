import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/test/.+/postgres-.+\\.spec\\.ts',
    '<rootDir>/test/object-mothers/',
    '<rootDir>/test/test-doubles/',
  ],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
};

export default config;
