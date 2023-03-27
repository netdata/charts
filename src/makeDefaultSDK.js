import dygraph from "./chartLibraries/dygraph"
import easypiechart from "./chartLibraries/easyPie"
import gauge from "./chartLibraries/gauge"
import numberChart from "./chartLibraries/number"
import groupBoxes from "./chartLibraries/groupBoxes"
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
    ui: { dygraph, easypiechart, gauge, groupBoxes, number: numberChart },
    plugins: {
      unitConversion,
      hover,
      pan,
      highlight,
      select,
      selectVertical,
      play,
      move,
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
