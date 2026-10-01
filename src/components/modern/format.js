import convert from "@/helpers/units"

const digitsForMagnitude = value => {
  const magnitude = Math.abs(value)
  if (magnitude >= 100) return 0
  if (magnitude >= 10) return 1
  return 2
}

const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits

export const readoutDigits = value => {
  const digits = digitsForMagnitude(value)
  const rounded = round(value, digits)
  if (Number.isInteger(rounded)) return 0
  return Math.min(digits, digitsForMagnitude(rounded))
}

const userDigits = chart => {
  const digits = chart.getAttribute("staticFractionDigits")
  return typeof digits === "number" && digits >= 0
}

export const formatReadout = (
  chart,
  value,
  { dimensionId, key = "units", withUnit = false, unitAttributes: scaled } = {}
) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-"

  const unitAttributes = scaled || chart.getUnitAttributes(dimensionId, key)
  const converted = convert(chart, unitAttributes.method, value, unitAttributes.divider)
  const fractionDigits =
    userDigits(chart) || typeof converted !== "number" ? undefined : readoutDigits(converted)
  const options = { dimensionId, key, unitAttributes, fractionDigits }

  return withUnit
    ? chart.getConvertedValueWithUnit(value, options)
    : chart.getConvertedValue(value, options)
}
