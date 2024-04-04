import dygraph from "./chartLibraries/dygraph"
import easypiechart from "./chartLibraries/easyPie"
import gauge from "./chartLibraries/gauge"
import number from "./chartLibraries/number"
import d3pie from "./chartLibraries/d3pie"
import bars from "./chartLibraries/bars"
import groupBoxes from "./chartLibraries/groupBoxes"
import table from "./chartLibraries/table"
import makeSDK from "./sdk"
import unitConversion from "./sdk/plugins/unitConversion"
import hover from "./sdk/plugins/hover"
import pan from "./sdk/plugins/pan"
import move from "./sdk/plugins/move"
import highlight from "./sdk/plugins/highlight"
import select from "./sdk/plugins/select"
import selectVertical from "./sdk/plugins/selectVertical"
import play from "./sdk/plugins/play"

const minutes15 = 15 * 60

export default ({ attributes, ...options } = {}) =>
  makeSDK({
    ui: { dygraph, easypiechart, gauge, groupBoxes, number, d3pie, bars, table },
    plugins: {
      // order matters
      move,
      unitConversion,
      hover,
      pan,
      highlight,
      select,
      selectVertical,
      play,
    },
    attributes: {
      _v: "v3",
      chartLibrary: "dygraph",
      navigation: "pan",
      after: -1 * minutes15,
      overlays: { proceeded: { type: "proceeded" } },
      ...attributes,
    },
    ...options,
  })
