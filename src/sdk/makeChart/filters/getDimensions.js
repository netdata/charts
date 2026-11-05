export default chart => {
  const { selectedDimensions, groupBy, dimensionsOnNonDimensionGrouping } = chart.getAttributes()

  if (selectedDimensions?.length) return selectedDimensions
  if (groupBy?.includes("dimension")) return selectedDimensions

  return dimensionsOnNonDimensionGrouping || selectedDimensions
}
