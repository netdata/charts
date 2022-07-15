const webpackConfig = require("../webpack.config.js")

module.exports = {
  stories: ["../src/**/*.stories.js"],
  webpackFinal: async config => {
    const [, ...rest] = webpackConfig.module.rules

    return {
      ...config,
      module: {
        ...config.module,
        rules: [{ test: /\.js$/, loader: "babel-loader" }, ...rest],
      },
    }
  },
}
