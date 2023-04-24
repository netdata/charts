import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const dygraph = chartUI.getDygraph()

  const [, before] = dygraph.xAxisRange()
  const beforeSecs = before / 1000

  const firstEntry = chartUI.chart.getFirstEntry()
  const { outOfLimits, error } = chartUI.chart.getAttributes()

  if (!outOfLimits && (!firstEntry || firstEntry > beforeSecs) && !error) return

  const range = outOfLimits || error ? [before, before] : [firstEntry, firstEntry]

  const area = getArea(dygraph, range)

  trigger(chartUI, id, area)
}
