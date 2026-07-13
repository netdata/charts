const maxRegularNumberLength = 18
const numberFormatters = new Map()

const formatExponential = value =>
  value
    .toExponential(3)
    .replace(/(\.\d*?)0+e/, "$1e")
    .replace(/\.e/, "e")

const getNumberFormatter = (locale, minimumFractionDigits, maximumFractionDigits) => {
  const key = JSON.stringify([locale, minimumFractionDigits, maximumFractionDigits], (_, value) =>
    typeof value === "undefined" ? "__undefined__" : value
  )

  if (numberFormatters.has(key)) return numberFormatters.get(key)

  const formatter = Intl.NumberFormat(locale || undefined, {
    useGrouping: true,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  numberFormatters.set(key, formatter)

  return formatter
}

export const formatRegularNumber = (node, value, fractionDigits, unitsConversionFractionDigits) => {
  const minimumFractionDigits = isNaN(fractionDigits) || fractionDigits < 0 ? 0 : fractionDigits
  const maximumFractionDigits =
    fractionDigits === null || isNaN(fractionDigits) || fractionDigits < 0
      ? unitsConversionFractionDigits === -1
        ? 4
        : unitsConversionFractionDigits
      : fractionDigits

  return getNumberFormatter(
    node.getAttribute("locale"),
    minimumFractionDigits,
    maximumFractionDigits
  ).format(value)
}

export const shouldUseExponential = (node, value, fractionDigits, unitsConversionFractionDigits) =>
  Number.isFinite(value) &&
  formatRegularNumber(node, value, fractionDigits, unitsConversionFractionDigits).length >
    maxRegularNumberLength

export default (node, value, fractionDigits, unitsConversionFractionDigits) => {
  const formatted = formatRegularNumber(node, value, fractionDigits, unitsConversionFractionDigits)

  if (!Number.isFinite(value) || formatted.length <= maxRegularNumberLength) return formatted

  return formatExponential(value)
}
