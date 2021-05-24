import makeDygraph from "./chartLibraries/dygraph"
import makeSDK from "./sdk"
import hover from "./sdk/plugins/hover"
import pan from "./sdk/plugins/pan"
import highlight from "./sdk/plugins/highlight"

export default () =>
  makeSDK({
    defaultUI: "dygraph",
    ui: {
      dygraph: makeDygraph,
    },
    plugins: {
      hover,
      pan,
      highlight,
    },
    attributes: {
      navigation: "pan",
      after: Date.now() - 15 * 60 * 1000,
      before: Date.now(),
    },
  })
