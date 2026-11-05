import { trigger, getArea } from "./helpers"

export default (chartUI, id) => {
  const u = chartUI.getUPlot()
  if (!u) return

  const [, before] = chartUI.getXAxisRange()
  const beforeSecs = before / 1000

  const firstEntry = chartUI.chart.getFirstEntry()
  const { outOfLimits, error } = chartUI.chart.getAttributes()

  if (!outOfLimits && (!firstEntry || firstEntry > beforeSecs) && !error) return

  const range = outOfLimits || error ? [before, before] : [firstEntry, firstEntry]

  const area = getArea(chartUI, range)

  trigger(chartUI, id, area)
}
