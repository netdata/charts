import convert from "@/helpers/units"
import { getMaximumFractionDigits } from "@/helpers/formatNumber"

const isMissing = value => value === null || value === undefined || Number.isNaN(value)

export const getReadoutUnitAttributes = (chart, value, { dimensionId, key = "units" } = {}) =>
  isMissing(value)
    ? chart.getUnitAttributes(dimensionId, key)
    : chart.getUnitAttributesForValue(value, { dimensionId, key })

export const formatReadoutUnit = (
  chart,
  value,
  { dimensionId, key = "units", unitAttributes } = {}
) =>
  chart.getUnitSign({
    key,
    dimensionId,
    unitAttributes: unitAttributes || getReadoutUnitAttributes(chart, value, { dimensionId, key }),
  })

export const formatReadout = (
  chart,
  value,
  { dimensionId, key = "units", withUnit = false, unitAttributes: scaled } = {}
) => {
  if (isMissing(value)) return "-"

  const unitAttributes = scaled || getReadoutUnitAttributes(chart, value, { dimensionId, key })
  const options = { dimensionId, key, unitAttributes }

  return withUnit
    ? chart.getConvertedValueWithUnit(value, options)
    : chart.getConvertedValue(value, options)
}

export const readoutRoundsToZero = (
  chart,
  value,
  { dimensionId, key = "units", unitAttributes: scaled } = {}
) => {
  const { method, divider, fractionDigits } =
    scaled || getReadoutUnitAttributes(chart, value, { dimensionId, key })
  const converted = convert(chart, method, value, divider)
  if (typeof converted !== "number") return false

  const digits = getMaximumFractionDigits(
    chart.getAttribute("staticFractionDigits"),
    fractionDigits
  )
  return Number(Math.abs(converted).toFixed(digits)) === 0
}
