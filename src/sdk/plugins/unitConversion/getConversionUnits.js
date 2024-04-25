import conversableUnits, { makeConversableKey } from "@/helpers/units/conversableUnits"
import convert, {
  getScales,
  getUnitConfig,
  getUnitsString,
  unitsMissing,
  isAdditive,
} from "@/helpers/units"

const scalable = (units, delta, desiredUnits) => {
  const [scaleKeys, scaleByKey] = getScales(units)

  const { base_unit: base = units, prefix_symbol: prefix } = getUnitConfig(units)

  const { base_unit: desiredBase = desiredUnits, prefix_symbol: desiredPrefix } =
    getUnitConfig(desiredUnits)

  if (desiredUnits && base === desiredBase && prefix !== desiredPrefix) {
    const desiredScales = getScales(desiredUnits)

    if (desiredScales) {
      return [
        "adjust",
        value => (value / (scaleByKey[prefix] || 1)) * (scaleByKey[desiredPrefix] || 1),
        getUnitsString(units, desiredPrefix, desiredBase),
        desiredPrefix,
        desiredBase,
      ]
    }
  }

  const scale = scaleKeys.reverse().find(scale => delta >= (scaleByKey[scale] || 1))

  return scale
    ? [
        "adjust",
        value => (value / (scaleByKey[prefix] || 1)) * (scaleByKey[scale] || 1),
        getUnitsString(units, scale, base),
        scale,
        base,
      ]
    : ["original"]
}

const conversable = (chart, units, delta, desiredUnits) => {
  const scales = conversableUnits[units]

  if (desiredUnits !== "auto") {
    return desiredUnits in scales
      ? [makeConversableKey(units, desiredUnits), undefined, desiredUnits]
      : ["original"]
  }

  const scaleKeys = Object.keys(scales)
  const scaleIndex = scaleKeys.findIndex(scale => (scales[scale] || 1).check(chart, delta))

  if (scaleIndex === -1) return ["original"]

  const key = scaleKeys[scaleIndex]
  return [makeConversableKey(units, key), undefined, key]
}

const getMethod = (chart, units, min, max) => {
  if (unitsMissing(units) || !isAdditive(units)) return ["original"]

  const { desiredUnits } = chart.getAttributes()

  const absMin = Math.abs(min)
  const absMax = Math.abs(max)
  const delta = absMin > absMax ? absMin : absMax

  if (conversableUnits[units]) return conversable(chart, units, delta, desiredUnits)

  return scalable(units, delta, desiredUnits)
}

const decimals = [1000, 100, 10, 1, 0.1, 0.01, 0.001]

const getFractionDigits = value => {
  const index = decimals.findIndex(d => value > d)
  const digits = index === -1 ? decimals.length - 1 : index
  return digits === 3 ? 2 : digits
}

const getConversionUnits = (chart, unitsKey, min, max, maxDecimals = 5) => {
  const units = chart.getAttribute(unitsKey)

  return units.reduce(
    (h, unit) => {
      const [method, divider, unitsConversion = units, prefix = "", base = ""] = getMethod(
        chart,
        unit,
        min,
        max
      )

      const cMin = convert(chart, method, min, divider)
      const cMax = convert(chart, method, max, divider)

      const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)

      const fractionDigits =
        method === "original" || method === "divide" || method === "adjust"
          ? getFractionDigits(delta)
          : -1

      h.method.push(method)
      h.divider.push(divider)
      h.units.push(unitsConversion)
      h.fractionDigits.push(fractionDigits > maxDecimals ? maxDecimals : fractionDigits)
      h.prefix.push(prefix)
      h.base.push(base)

      return h
    },
    { method: [], divider: [], units: [], fractionDigits: [], prefix: [], base: [] }
  )
}

export default getConversionUnits
