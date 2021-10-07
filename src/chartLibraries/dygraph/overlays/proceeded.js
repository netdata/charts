import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const { firstEntry } = chartUI.chart.getMetadata()
  const dygraph = chartUI.getDygraph()

  const [, before] = dygraph.xAxisRange()

  if (firstEntry > before / 1000) return

  const area = getArea(dygraph, [firstEntry, firstEntry])

  trigger(chartUI, id, area)
}
