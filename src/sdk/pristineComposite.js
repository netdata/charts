import makePristine from "@/helpers/makePristine"

export const pristineCompositeKey = "pristineComposite"

const { updatePristine, resetPristine } = makePristine(pristineCompositeKey, [
  "aggregationMethod",
  "selectedDimensions",
  "dimensionsAggregationMethod",
  "groupBy",
  "groupingMethod",
  "chartType",
  "selectedLabels",
  "selectedHosts",
  "selectedInstances",
])

export default { update: updatePristine, reset: resetPristine }
