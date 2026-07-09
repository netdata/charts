import { getUnitConfig, getUnitsString } from "@/helpers/units"
import { getConversionAttributes } from "@/helpers/unitConversion/getConversionUnits"

export default chart =>
  (chart.getUnitSign = ({
    dimensionId,
    long = false,
    key = "units",
    withoutConversion = false,
    unitAttributes,
    value,
  } = {}) => {
    const { base, prefix, unit } =
      unitAttributes ||
      (typeof value === "undefined"
        ? chart.getUnitAttributes(dimensionId, key)
        : chart.getUnitAttributesForValue(value, { dimensionId, key }))

    if (withoutConversion) return getUnitConfig(unit).name

    return getUnitsString(unit, prefix, base, long)
  })

export const makeGetUnitAttributesForValue = chart =>
  (chart.getUnitAttributesForValue = (
    value,
    { dimensionId, key = "units", min = value, max = value } = {}
  ) => {
    const units = chart.getAttribute(key)
    const unit = dimensionId
      ? chart.getDimensionUnit(dimensionId)
      : Array.isArray(units)
        ? units[0]
        : units

    return getConversionAttributes(chart, unit, { min, max })
  })
