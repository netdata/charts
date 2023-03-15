import initialAttributes from "@/sdk/initialAttributes"
import { stackedAggregations } from "@/sdk/filters/getInitialAttributes"
import getAggregateMethod from "@/sdk/filters/getAggregateMethod"

const notStackedByGroupBy = {
  dimension: true,
  _collect_job: true,
}

const getChartType = (chart, { groupBy, groupByLabel }) => {
  const { aggregationMethod: aggregationMethodAttr, chartType } = chart.getAttributes()

  if (groupBy.length > 1 || groupByLabel.length > 1) return chartType || initialAttributes.chartType

  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(chart)

  if (
    !notStackedByGroupBy[groupBy[0]] &&
    !notStackedByGroupBy[groupByLabel[0]] &&
    stackedAggregations[aggregationMethod]
  )
    return "stacked"

  return chartType || initialAttributes.chartType
}

export default getChartType
