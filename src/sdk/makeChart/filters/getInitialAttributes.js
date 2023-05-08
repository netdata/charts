import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"

export const stackedAggregations = {
  avg: true,
  sum: true,
}

export default chart => {
  const dimensionIds = chart.getAttribute("dimensionIds")
  const aggregationMethodAttr = chart.getAttribute("aggregationMethod")
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(chart)

  return {
    aggregationMethod,
    selectedDimensions: getDimensions(chart),
    initializedFilters: !!dimensionIds.length,
  }
}
