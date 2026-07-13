import { getNormalizedUnitConfig, getUnitsString } from "@/helpers/units"

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

    if (withoutConversion) return getNormalizedUnitConfig(unit).name

    return getUnitsString(unit, prefix, base, long)
  })
