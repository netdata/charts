import conversableUnits, {
  makeConversableKey,
  keys as conversableKeys,
} from "@/helpers/units/conversableUnits"
import convert, { getScales, getUnitConfig, isScalable, getExponent } from "@/helpers/units"

const selfOrExponent = (u, scaleByKey) => {
  const exponent = getExponent(u)
  if (!exponent) return scaleByKey[u] || 1

  return Math.pow(scaleByKey[u], exponent)
}

const scalable = (units, delta, desiredUnits) => {
  const [scaleKeys, scaleByKey] = getScales(units)

  const { base_unit: base = units, prefix_symbol: prefix } = getUnitConfig(units)
  const prefixScale = selfOrExponent(prefix, scaleByKey)

  if (desiredUnits && desiredUnits !== "auto" && desiredUnits !== "original") {
    if (scaleByKey[desiredUnits] !== undefined) {
      return [
        "adjust",
        value => (value * prefixScale) / selfOrExponent(desiredUnits, scaleByKey),
        desiredUnits === "1" ? "" : desiredUnits,
        base,
      ]
    }
  }

  delta = delta * prefixScale
  const scale = [...scaleKeys].reverse().find(scale => delta >= selfOrExponent(scale, scaleByKey))

  return scale
    ? [
        "adjust",
        value => (value * prefixScale) / selfOrExponent(scale, scaleByKey),
        scale === "1" ? "" : scale,
        base,
      ]
    : ["original"]
}

const conversable = (chart, units, delta, desiredUnits) => {
  const scales = conversableUnits[units]

  if (desiredUnits && desiredUnits !== "auto" && desiredUnits !== "original") {
    return desiredUnits in scales
      ? [makeConversableKey(units, desiredUnits), undefined, desiredUnits]
      : ["original"]
  }

  if (desiredUnits === "original") {
    return ["original"]
  }

  const scaleKeys = conversableKeys[units] || Object.keys(scales)
  const scaleIndex = scaleKeys.findIndex(scale => (scales[scale] || 1).check(chart, delta))

  if (scaleIndex === -1) return ["original"]

  const key = scaleKeys[scaleIndex]

  return [makeConversableKey(units, key), null, "", key]
}

const getMethod = (chart, units, min, max) => {
  if (!isScalable(units)) return ["original"]

  const allUnits = chart.getAttribute("units")
  const desiredUnitsArray = chart.getAttribute("desiredUnits") || ["auto"]
  const unitIndex = allUnits.indexOf(units)
  const desiredUnits = unitIndex >= 0 ? desiredUnitsArray[unitIndex] || "auto" : "auto"

  if (desiredUnits === "original") {
    return ["original"]
  }

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
