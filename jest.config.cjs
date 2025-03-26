module.exports = {
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!**/*.test.js'
  ],
  coverageDirectory: 'test-output',
  coverageReporters: [
    'text-summary',
    'lcov'
  ],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/test-output/',
    '<rootDir>/test/',
    '<rootDir>/jest.config.cjs'
  ],
  modulePathIgnorePatterns: [
    'node_modules'
  ],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'jest tests',
        outputDirectory: 'test-output',
        outputName: 'junit.xml'
      }
    ]
  ],
  resetMocks: true,
  restoreMocks: true,
  setupFilesAfterEnv: [
    '<rootDir>/test/setup.js'
  ],
  testEnvironment: 'node',
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(ffc-ahwr-common-library)/)'
  ],
  testPathIgnorePatterns: [],
  verbose: true
}
