const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const path = require("path")

const isProduction = process.env.NODE_ENV === "production"

module.exports = {
  mode: process.env.NODE_ENV || "development",
  devtool: "hidden-source-map",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: isProduction ? "sdk.min.js" : "sdk.js",
    library: "NetdataSDK",
    libraryTarget: "var",
  },
  externals: [
    "react",
    "react-dom",
    "styled-components",
    ({ request }, callback) => {
      if (/@netdata\/netdata-ui\/.+$/.test(request)) {
        return callback(null, "commonjs " + request)
      }
      callback()
    },
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        //svg-sprite-loader
        test: /\.svg$/,
        include: [/node_modules\/@netdata\/netdata-ui/, /src\/components\/icon\/assets/],
        loader: "raw-loader",
        options: {
          esModule: false,
        },
      },
    ],
  },
  plugins: [new CleanWebpackPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}
