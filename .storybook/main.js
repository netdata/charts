const webpackConfig = require("../webpack.config.js")

module.exports = {
  stories: ["../src/**/*.stories.js"],
  webpackFinal: async config => {
    return {
      ...config,
      module: {
        ...config.module,
        rules: webpackConfig.module.rules,
      },
    }
  },
}
