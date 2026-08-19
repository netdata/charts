const definitions = Object.freeze({
  line: Object.freeze({ publicLibrary: "dygraph", legacyRenderer: "dygraph", timeSeries: true }),
  stacked: Object.freeze({
    publicLibrary: "dygraph",
    legacyRenderer: "dygraph",
    timeSeries: true,
  }),
  area: Object.freeze({ publicLibrary: "dygraph", legacyRenderer: "dygraph", timeSeries: true }),
  stackedBar: Object.freeze({
    publicLibrary: "dygraph",
    legacyRenderer: "dygraph",
    timeSeries: true,
  }),
  multiBar: Object.freeze({
    publicLibrary: "dygraph",
    legacyRenderer: "dygraph",
    timeSeries: true,
  }),
  heatmap: Object.freeze({
    publicLibrary: "dygraph",
    legacyRenderer: "dygraph",
    timeSeries: true,
  }),
  easypiechart: Object.freeze({
    publicLibrary: "easypiechart",
    legacyRenderer: "easypiechart",
    timeSeries: false,
  }),
  gauge: Object.freeze({ publicLibrary: "gauge", legacyRenderer: "gauge", timeSeries: false }),
  number: Object.freeze({ publicLibrary: "number", legacyRenderer: "number", timeSeries: false }),
  d3pie: Object.freeze({ publicLibrary: "d3pie", legacyRenderer: "d3pie", timeSeries: false }),
  bars: Object.freeze({ publicLibrary: "bars", legacyRenderer: "bars", timeSeries: false }),
  groupBoxes: Object.freeze({
    publicLibrary: "groupBoxes",
    legacyRenderer: "groupBoxes",
    timeSeries: false,
  }),
  table: Object.freeze({ publicLibrary: "table", legacyRenderer: "table", timeSeries: false }),
})

const defaultTimeSeries = Object.freeze({
  publicLibrary: "dygraph",
  legacyRenderer: "dygraph",
  timeSeries: true,
})

export const getVisualizationMetadata = visualization =>
  definitions[visualization] || defaultTimeSeries

export const getPublicChartLibrary = visualization =>
  getVisualizationMetadata(visualization).publicLibrary

export const getLegacyRenderer = visualization =>
  getVisualizationMetadata(visualization).legacyRenderer

export const isTimeSeriesVisualization = visualization =>
  Boolean(visualization && getVisualizationMetadata(visualization).timeSeries)

export const inferVisualization = ({ chartLibrary, chartType }) => {
  const libraryDefinition = definitions[chartLibrary]
  if (libraryDefinition && !libraryDefinition.timeSeries) return chartLibrary
  if (chartType) return chartType
  return null
}

export default definitions
