import makePristine from "@/helpers/makePristine"

export const pristineKey = "pristine"

const { updatePristine, resetPristine } = makePristine(pristineKey, [
  "aggregationMethod",
  "groupBy",
  "groupByLabel",

  "postAggregationMethod",
  "postGroupBy",
  "postGroupByLabel",

  "groupingMethod",
  "groupingTime",

  "chartType",
  "chartLibrary",

  "selectedDimensions",
  "selectedLabels",
  "selectedNodes",
  "selectedInstances",

  "sparkline",
  "selectedLegendDimensions",
  "showingInfo",

  "dimensionsSortBy",
  "instancesSortBy",
  "nodesSortBy",
  "groupBySortBy",
  "labelsSortBy",
  "dimensionsSort",

  "nodesExpanded",
  "groupByExpanded",
  "labelsExpanded",

  "expanded",
  "staticZones",

  "showPostAggregations",
  "selectedNodeLabelsFilter",
])

export default { update: updatePristine, reset: resetPristine }
