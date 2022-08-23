import initialAttributes from "@/sdk/initialAttributes"
import { stackedAggregations } from "@/sdk/filters/getInitialAttributes"
import getAggregateMethod from "@/sdk/filters/getAggregateMethod"

const getDefaultChartType = chart => {
  const {
    aggregationMethod: aggregationMethodAttr,
    composite,
    groupBy,
    units,
  } = chart.getAttributes()
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(units)

  if (composite && groupBy !== "dimension" && stackedAggregations[aggregationMethod]) {
    return "stacked"
  }
  return chart.getMetadata().chartType || initialAttributes.chartType
}

export default getDefaultChartType
