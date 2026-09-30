import convert from "@/helpers/units"

// the chart's own formatting allows up to 4 decimals for auto-scaled units; readouts stay calm
// with fewer digits as the converted magnitude grows
export const readoutDigits = value => {
  const magnitude = Math.abs(value)
  if (magnitude >= 100) return 0
  if (magnitude >= 10) return 1
  return 2
}

const userDigits = chart => {
  const digits = chart.getAttribute("staticFractionDigits")
  return typeof digits === "number" && digits >= 0
}

export const formatReadout = (
  chart,
  value,
  { dimensionId, key = "units", withUnit = false } = {}
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-"

  const unitAttributes = chart.getUnitAttributes(dimensionId, key)
  const converted = convert(chart, unitAttributes.method, value, unitAttributes.divider)
  const fractionDigits =
    userDigits(chart) || typeof converted !== "number" ? undefined : readoutDigits(converted)
  const options = { dimensionId, key, unitAttributes, fractionDigits }

  return withUnit
    ? chart.getConvertedValueWithUnit(value, options)
    : chart.getConvertedValue(value, options)
}
