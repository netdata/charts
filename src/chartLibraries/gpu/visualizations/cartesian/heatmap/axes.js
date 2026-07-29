import { makeCartesianAxes, makePlotArea } from "../axes"

export const makeHeatmapAxes = options => {
  const { chart, width, height } = options
  const plot = makePlotArea(chart, width, height)
  const ids = chart.getVisibleHeatmapIds()
  const maxTicks = Math.floor(plot.height / 15)
  const hiddenStep = Math.ceil(ids.length / (maxTicks - 1))
  const yTicks = ids.map((id, index) => ({
    v: index,
    label: index % hiddenStep === 0 ? chart.getDimensionName(id) : null,
  }))

  return makeCartesianAxes({ ...options, yTicks })
}
