import makeDygraph from "./chartLibraries/dygraph"
import makeSDK from "./sdk"
import unitConversion from "./sdk/plugins/unitConversion"
import hover from "./sdk/plugins/hover"
import pan from "./sdk/plugins/pan"
import move from "./sdk/plugins/move"
import highlight from "./sdk/plugins/highlight"
import select from "./sdk/plugins/select"
import play from "./sdk/plugins/play"

const minutes15 = 15 * 60

export default ({ attributes, ...options } = {}) =>
  makeSDK({
    ui: {
      dygraph: makeDygraph,
    },
    plugins: {
      unitConversion,
      hover,
      pan,
      highlight,
      select,
      play,
      move,
    },
    attributes: {
      chartLibrary: "dygraph",
      navigation: "pan",
      after: -1 * minutes15,
      ...attributes,
    },
    ...options,
  })
