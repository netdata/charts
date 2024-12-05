import conversableUnits, {
  makeConversableKey,
  keys as conversableKeys,
} from "@/helpers/units/conversableUnits"
import convert, { getScales, getUnitConfig, isScalable } from "@/helpers/units"

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
        value => (value * (scaleByKey[prefix] || 1)) / (scaleByKey[desiredPrefix] || 1),
        desiredPrefix,
        desiredBase,
      ]
    }
  }

  delta = delta * (scaleByKey[prefix] || 1)
  const scale = [...scaleKeys].reverse().find(scale => delta >= (scaleByKey[scale] || 1))

  return scale
    ? [
        "adjust",
        value => (value * (scaleByKey[prefix] || 1)) / (scaleByKey[scale] || 1),
        scale === "1" ? "" : scale,
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

  const scaleKeys = conversableKeys[units] || Object.keys(scales)
  const scaleIndex = scaleKeys.findIndex(scale => (scales[scale] || 1).check(chart, delta))

  if (scaleIndex === -1) return ["original"]

  const key = scaleKeys[scaleIndex]

  return [makeConversableKey(units, key), null, "", key]
}

const getMethod = (chart, units, min, max) => {
  if (!isScalable(units)) return ["original"]

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
  return digits === 3 ? 4 : digits
}

export const getConversionAttributes = (chart, unit, { min, max, maxDecimals = 5 }) => {
  const [method, divider, prefix = "", base = ""] = getMethod(chart, unit, min, max)

  const cMin = convert(chart, method, min, divider)
  const cMax = convert(chart, method, max, divider)

  const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)

  const fractionDigits = isNaN(delta) || delta === 0 ? -1 : getFractionDigits(delta)

  return {
    method,
    divider,
    fractionDigits: fractionDigits > maxDecimals ? maxDecimals : fractionDigits,
    prefix,
    base,
    unit,
  }
}

const getConversionUnits = (chart, unitsKey, options = {}) => {
  const units = chart.getAttribute(unitsKey)

  return units.reduce(
    (h, unit) => {
      const { method, divider, fractionDigits, prefix, base } = getConversionAttributes(
        chart,
        unit,
        options
      )

      h.method.push(method)
      h.divider.push(divider)
      h.fractionDigits.push(fractionDigits)
      h.prefix.push(prefix)
      h.base.push(base)

      return h
    },
    { method: [], fractionDigits: [], prefix: [], base: [], divider: [] }
  )
}

export default getConversionUnits
