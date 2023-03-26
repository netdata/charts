import getChartType from "./getChartType"
import getAggregateMethod from "./getAggregateMethod"
import getDimensions from "./getDimensions"
import getDefaultGroupBy from "./getGroupBy"

export const stackedAggregations = {
  avg: true,
  sum: true,
}

export default chart => {
  const dimensions = chart.getAttribute("dimensions")
  const aggregationMethodAttr = chart.getAttribute("aggregationMethod")
  const [groupBy, groupByLabel] = getDefaultGroupBy(chart)

  const chartType = chart.getAttribute("chartType")
  const aggregationMethod = aggregationMethodAttr || getAggregateMethod(chart)

  return {
    aggregationMethod,
    selectedDimensions: getDimensions(chart, { groupBy, groupByLabel }),
    groupBy,
    groupByLabel,
    chartType: chartType || getChartType(chart, { groupBy, groupByLabel }),
    initializedFilters: !!dimensions.length,
  }
}
