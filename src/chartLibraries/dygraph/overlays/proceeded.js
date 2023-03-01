import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const dygraph = chartUI.getDygraph()

  const [, before] = dygraph.xAxisRange()
  const beforeSecs = before / 1000

  const firstEntry = chartUI.chart.getFirstEntry()
  const { outOfLimits, error } = chartUI.chart.getAttributes()

  if (!outOfLimits && (!firstEntry || firstEntry > beforeSecs / 1000) && !error) return

  const range = outOfLimits || error ? [before / 1000, before / 1000] : [firstEntry, firstEntry]

  const area = getArea(dygraph, range)

  trigger(chartUI, id, area)
}
