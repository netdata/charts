const webpackConfig = require("../webpack.config.js")

module.exports = {
  stories: ["../src/**/*.stories.js"],
  addons: ["@storybook/addon-controls"],
  webpackFinal: async config => {
    return { ...config, module: { ...config.module, rules: webpackConfig.module.rules } }
  },
  core: {
    builder: "webpack5",
  },
}
