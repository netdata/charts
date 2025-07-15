import { fetchDrilldownData } from "./dataFetcher"
import makeLog from "@/sdk/makeLog"

export default (chart, selected) => {
  const baseUpdateGroupBy = chart.baseUpdateGroupBy

  if (!baseUpdateGroupBy) {
    console.error("baseUpdateGroupBy not available")
    return
  }

  const log = makeLog(chart)

  const changed = baseUpdateGroupBy(selected, {
    groupByKey: "drilldown.groupBy",
    groupByLabelKey: "drilldown.groupByLabel",
    fallbackGroupBy: ["node", "instance", "dimension"],
    dataKey: "drilldown.data",
    loadingKey: "drilldown.loading",
  })
  if (!changed) return

  fetchDrilldownData(chart)

  log({
    chartAction: "drilldown-groupby-change",
    value: selected,
  })
}
