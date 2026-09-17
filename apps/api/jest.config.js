module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: ['**/*.(t|j)s'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@prisma/client$': '<rootDir>/test/prisma-client.ts',
    '^bullmq$': '<rootDir>/test/bullmq.ts',
    '^pdf-parse$': '<rootDir>/test/pdf-parse.ts',
  },
};
