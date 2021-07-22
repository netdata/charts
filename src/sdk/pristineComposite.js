import makePristine from "@/helpers/makePristine"

export const pristineCompositeKey = "pristineComposite"

const { updatePristine, resetPristine } = makePristine(pristineCompositeKey, [
  "aggregationMethod",
  "dimensions",
  "dimensionsAggregationMethod",
  "groupBy",
])

export default { update: updatePristine, reset: resetPristine }
