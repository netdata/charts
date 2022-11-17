import makePristine from "@/helpers/makePristine"

export const pristineCompositeKey = "pristineComposite"

const { updatePristine, resetPristine } = makePristine(pristineCompositeKey, [
  "aggregationMethod",
  "dimensions",
  "dimensionsAggregationMethod",
  "groupBy",
  "groupingMethod",
  "chartType",
  "filteredLabels",
  "selectedNodeIds",
  "selectedInstances",
])

export default { update: updatePristine, reset: resetPristine }
