// The Agent reports an empty label value as "[none]" and a label missing from an instance as "[unset]".
const placeholderValues = new Set(["[none]", "[unset]"])

const isDisplayValue = value =>
  typeof value === "string" && value.trim() !== "" && !placeholderValues.has(value)

const getLabelValue = (viewDimensions, key, index) => {
  const values = viewDimensions?.labels?.[key]?.[index]
  return Array.isArray(values) ? (values.find(isDisplayValue) ?? null) : null
}

export const getGroupLabelDisplay = (groupByLabelDisplay, viewDimensions, index, partIndex) => {
  const grouped = viewDimensions?.grouped?.[partIndex]
  if (!grouped?.startsWith("label:")) return null

  const preferred = groupByLabelDisplay?.[grouped.slice("label:".length)]
  if (!Array.isArray(preferred)) return null

  return preferred.map(key => getLabelValue(viewDimensions, key, index)).find(Boolean) ?? null
}
