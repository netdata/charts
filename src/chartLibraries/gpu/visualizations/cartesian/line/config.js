export const makeLineStyle = chart => {
  const stepped = chart.getAttribute("stepPlot")
  return {
    fillAlpha: 0,
    lineWidth: 1.5,
    smooth: !stepped,
    stepped,
  }
}

export const shouldIncludeZero = ({
  includeZero,
  forceIncludeZero,
  dimensionCount,
  selectedDimensionCount,
}) =>
  Boolean(
    includeZero ||
      (forceIncludeZero && dimensionCount > 1 && selectedDimensionCount > 1)
  )
