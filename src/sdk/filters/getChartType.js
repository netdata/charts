import initialAttributes from "@/sdk/initialAttributes"
import { stackedAggregations } from "@/sdk/filters/getInitialAttributes"
import getAggregateMethod from "@/sdk/filters/getAggregateMethod"

const notStackedGroupBy = ["dimension", "_collect_job"]

const getChartType = (chart, initialGroupBy) => {
  const {
    aggregationMethod: aggregationMethodAttr,
    composite,
    groupBy: groupByAttr,
    units,
  } = chart.getAttributes()
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(units)
  const groupBy = groupByAttr || initialGroupBy

  if (composite && !notStackedGroupBy.includes(groupBy) && stackedAggregations[aggregationMethod])
    return "stacked"

  return chart.getMetadata().chartType || initialAttributes.chartType
}

export default getChartType
