import initialAttributes from "@/sdk/initialAttributes"
import { stackedAggregations } from "@/sdk/filters/getInitialAttributes"

const getDefaultChartType = chart => {
  const { aggregationMethod, composite, groupBy } = chart.getAttributes()
  if (composite) {
    return groupBy !== "dimension" && stackedAggregations[aggregationMethod]
      ? "stacked"
      : initialAttributes.chartType
  }
  return chart.getMetadata().chartType
}

export default getDefaultChartType
