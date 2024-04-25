import { getUnitConfig, getUnitsString } from "@/helpers/units"

export default chart =>
  (chart.getUnitSign = ({
    dimensionId,
    long = false,
    key = "units",
    withoutConversion = false,
  } = {}) => {
    const baseUnit = chart.getDimensionUnit(dimensionId)
    const unitIndex = chart.getAttribute(`${key}ByKey`)[baseUnit] || 0

    const units = chart.getAttribute(`${key}Conversion`)[unitIndex]
    const base = chart.getAttribute(`${key}ConversionBase`)[unitIndex]
    const prefix = chart.getAttribute(`${key}ConversionPrefix`)[unitIndex]

    if (withoutConversion) return getUnitConfig(base).name

    return getUnitsString(getUnitConfig(base), prefix, units, long)
  })
