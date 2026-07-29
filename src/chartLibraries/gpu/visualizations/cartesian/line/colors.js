import { parseColor } from "@/chartLibraries/gpu/color"

export { parseColor }

export const makeSeriesColors = chart => {
  const colors = new Float32Array(chart.getPayloadDimensionIds().length * 4)

  chart.getPayloadDimensionIds().forEach((id, index) => {
    const rgba = parseColor(chart.selectDimensionColor(id))
    if (!chart.isDimensionVisible(id)) rgba[3] = 0
    colors.set(rgba, index * 4)
  })

  return colors
}
