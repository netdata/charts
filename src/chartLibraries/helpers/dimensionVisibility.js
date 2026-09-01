export const isVisibleDimension = (chart, id) =>
  chart.getAttribute("selectedLegendDimensions")?.length ? chart.isDimensionVisible(id) : true
