import path from "node:path"
import { fileURLToPath } from "node:url"
import { prepareHighCardinalityFixtures } from "./prepareHighCardinalityFixtures.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const hasLocalHighCardinalityFixtures = process.env.LOCAL_HIGH_CARDINALITY_STORIES === "1"
const highCardinalitySourceDir = path.resolve(
  __dirname,
  "../.local/high-cardinality/responses"
)
const highCardinalityOutputDir = path.resolve(
  __dirname,
  "../.local/high-cardinality/sanitized"
)

if (hasLocalHighCardinalityFixtures) {
  prepareHighCardinalityFixtures({
    sourceDir: highCardinalitySourceDir,
    outputDir: highCardinalityOutputDir,
  })
}

const stories = ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"]
if (hasLocalHighCardinalityFixtures) stories.push("./highCardinality.stories.js")

const config = {
  stories,

  ...(hasLocalHighCardinalityFixtures && {
    staticDirs: [
      {
        from: highCardinalityOutputDir,
        to: "/high-cardinality-fixtures",
      },
    ],
  }),

  addons: [
    "@storybook/addon-links",
    "@storybook/addon-webpack5-compiler-babel",
    "@storybook/addon-docs",
  ],

  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },

  webpackFinal: async config => {
    config.module.rules.push(
      ...[
        {
          test: /\.(m?js)$/,
          type: "javascript/auto",
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.(png\?.*|jpg\?.*|jpg|png)$/,
          loader: "url-loader",
        },
        {
          test: /\.md$/,
          use: [
            {
              loader: "html-loader",
            },
            {
              loader: "markdown-loader",
            },
          ],
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: "svg-sprite-loader",
            },
            "svgo-loader",
          ],
        },
      ]
    )
    config.resolve.alias = {
      ...config.resolve.alias,
      src: path.resolve(__dirname, "../src/"),
      utils: path.resolve(__dirname, "../utils/"),
    }

    // Workaround to make storybook serve raw svg, not static path
    config.module.rules = config.module.rules.map(data => {
      if (/svg\|/.test(String(data.test)))
        data.test = /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|cur|ani)(\?.*)?$/
      return data
    })
    return config
  },
}
export default config
