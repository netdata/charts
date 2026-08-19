const path = require("node:path")

const repo = path.resolve(__dirname, "../..")

module.exports = {
  mode: "production",
  context: repo,
  entry: path.resolve(__dirname, "entry.js"),
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "benchmark.js",
    clean: true,
  },
  devtool: false,
  resolve: {
    alias: { "@": path.join(repo, "src") },
    extensions: [".js", ".mjs"],
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: require.resolve("babel-loader", { paths: [repo] }),
          options: { configFile: path.join(repo, "babel.config.js") },
        },
      },
      { test: /\.svg$/, type: "asset/source" },
      { test: /\.(png|jpg|jpeg|gif|webp)$/, type: "asset/resource" },
    ],
  },
  performance: { hints: false },
}
