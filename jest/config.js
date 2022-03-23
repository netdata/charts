module.exports = {
  rootDir: "../",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testRegex: ".*\\.test\\.js$",
  setupFiles: ["<rootDir>/jest/setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest/setupForEach.js"],
  verbose: true,
  transformIgnorePatterns: ["node_modules/(?!(.?netdata|dygraphs)/*)"],
  moduleDirectories: ["node_modules", "src", "jest"],
  roots: ["src/"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/jest/"],
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 1,
    },
  },
  testPathIgnorePatterns: ["/node_modules/"],
  reporters: ["default"],
  moduleFileExtensions: ["js"],
  cacheDirectory: "<rootDir>/.jest-tmp",
}
