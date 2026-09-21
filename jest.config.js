module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/test/styleMock.js',
  },
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'artifacts/test-results',
        outputName: 'junit.xml',
      },
    ],
  ],
};