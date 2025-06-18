module.exports = {
  rootDir: "../",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.svg": "<rootDir>/jest/svgTransform.js",
    "^.+\\.(css|less|scss|raw)$": "identity-obj-proxy",
  },
  testEnvironment: "jsdom",
  testRegex: ".*\\.test\\.js$",
  setupFiles: ["<rootDir>/jest/setup.js"],
  setupFilesAfterEnv: ["<rootDir>/jest/setupForEach.js"],
  verbose: true,
  transformIgnorePatterns: [
    "node_modules/(?!d3|d3-array|internmap|delaunator|robust-predicates|.?netdata|dygraphs)",
  ],
  moduleDirectories: ["node_modules", "src", "jest"],
  roots: ["src/"],
  collectCoverage: true,
  coverageDirectory: "<rootDir>/coverage",
  coveragePathIgnorePatterns: ["/node_modules/", "/jest/"],
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 47,
      lines: 50,
    },
  },
  testPathIgnorePatterns: ["/node_modules/"],
  reporters: ["default"],
  moduleFileExtensions: ["js"],
  cacheDirectory: "<rootDir>/.jest-tmp",
}
