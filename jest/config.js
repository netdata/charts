module.exports = {
  rootDir: "../",
  moduleNameMapper: {
    "^sdk/(.*)$": "<rootDir>/src/sdk/$1",
  },
  testRegex: ".*\\.test\\.js$",
  setupFiles: ["<rootDir>/jest/setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest/setupForEach.js"],
  verbose: true,
  moduleDirectories: ["node_modules", "src", "jest"],
  roots: ["src/"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/jest/"],
  coverageThreshold: {
    global: {
      branches: 92,
      functions: 92,
    },
  },
  testPathIgnorePatterns: ["/node_modules/"],
  reporters: ["default"],
  moduleFileExtensions: ["js"],
  cacheDirectory: "<rootDir>/.jest-tmp",
}
