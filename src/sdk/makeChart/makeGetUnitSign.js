import { getUnitConfig, getUnitsString } from "@/helpers/units"

export default chart =>
  (chart.getUnitSign = ({
    dimensionId,
    long = false,
    key = "units",
    withoutConversion = false,
  } = {}) => {
    const { base, prefix, unit } = chart.getUnitAttributes(dimensionId, key)

    if (withoutConversion) return getUnitConfig(unit).name

    return getUnitsString(unit, prefix, base, long)
  })
