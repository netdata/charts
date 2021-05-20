import makeDygraph from "./chartLibraries/dygraph"
import makeSDK from "./sdk"
import unitConversion from "./sdk/plugins/unitConversion"
import hover from "./sdk/plugins/hover"
import pan from "./sdk/plugins/pan"
import highlight from "./sdk/plugins/highlight"
import play from "./sdk/plugins/play"

export default options =>
  makeSDK({
    defaultUI: "dygraph",
    ui: {
      dygraph: makeDygraph,
    },
    plugins: {
      unitConversion,
      hover,
      pan,
      highlight,
      play,
    },
    attributes: {
      navigation: "pan",
      after: -1 * 15 * 60,
    },
    ...options,
  })
