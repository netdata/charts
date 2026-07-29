import { darkenColor } from "@/chartLibraries/dygraph/plotters/helpers"
import { parseColor } from "../line/colors"

export const makeStackedBarColors = chart => {
  const colors = new Float32Array(chart.getPayloadDimensionIds().length * 8)

  chart.getPayloadDimensionIds().forEach((id, index) => {
    const source = chart.selectDimensionColor(id)
    const fill = parseColor(source)
    const stroke = parseColor(darkenColor(source))
    if (!chart.isDimensionVisible(id)) {
      fill[3] = 0
      stroke[3] = 0
    }
    colors.set(fill, index * 8)
    colors.set(stroke, index * 8 + 4)
  })

  return colors
}
