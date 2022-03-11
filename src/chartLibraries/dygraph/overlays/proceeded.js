import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const dygraph = chartUI.getDygraph()

  const [, before] = dygraph.xAxisRange()
  const beforeSecs = before / 1000

  const firstEntry = chartUI.chart.getFirstEntry()
  const outOfLimits = chartUI.chart.getAttribute("outOfLimits")

  if (!outOfLimits && (!firstEntry || firstEntry > beforeSecs)) return

  const range = outOfLimits ? [beforeSecs, beforeSecs] : [firstEntry, firstEntry]
  const area = getArea(dygraph, range)

  trigger(chartUI, id, area)
}
