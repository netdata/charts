import makePristine from "@/helpers/makePristine"

export const pristineKey = "pristine"

const { updatePristine, resetPristine } = makePristine(pristineKey, [
  "aggregationMethod",

  "groupBy",
  "groupByLabel",
  "groupingMethod",
  "groupingTime",

  "chartType",

  "selectedDimensions",
  "selectedLabels",
  "selectedNodes",
  "selectedInstances",
])

export default { update: updatePristine, reset: resetPristine }
