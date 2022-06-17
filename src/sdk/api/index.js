import fetchCompositeChartData from "./fetchCompositeChartData"
import fetchSingleChartData from "./fetchSingleChartData"

export * from "./helpers"

export const fetchChartData = (chart, options) => {
  const { composite } = chart.getAttributes()

  return composite ? fetchCompositeChartData(chart, options) : fetchSingleChartData(chart, options)
}

export const fetchChartMetadata = () => {
  throw new Error("not implemented")
}
