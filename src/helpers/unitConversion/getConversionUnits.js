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

const precisionSoftMax = 5
const precisionHardMax = 10

const getRangeDelta = (min, max) => {
  const absMin = Math.abs(min)
  const absMax = Math.abs(max)

  return absMin > absMax ? absMin : absMax
}

const getFractionDigits = value => {
  if (!isFinite(value) || value <= 0) return -1

  if (value > 1000) return 0
  if (value > 100) return 1
  if (value > 10) return 2
  if (value >= 1) return 4

  return Math.ceil(-Math.log10(value))
}

const getCandidateFractionDigits = (chart, [method, divider], min, max, maxDecimals) => {
  const cMin = convert(chart, method, min, divider)
  const cMax = convert(chart, method, max, divider)

  if (typeof cMin !== "number" || typeof cMax !== "number") return -1

  const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)
  const fractionDigits = getFractionDigits(delta)

  if (fractionDigits === -1) return -1

  return Math.min(fractionDigits, maxDecimals)
}

const makeScalableCandidate = (scale, scaleByKey, prefixScale, base) => [
  "adjust",
  value => (value * prefixScale) / selfOrExponent(scale, scaleByKey),
  scale === "1" ? "" : scale,
  base,
]

const choosePrecisionCandidate = (chart, candidates, min, max, maxDecimals) => {
  const [firstCandidate] = candidates
  const firstDigits = getCandidateFractionDigits(chart, firstCandidate, min, max, maxDecimals)

  if (firstDigits === -1) return firstCandidate
  if (firstDigits >= 0 && firstDigits <= precisionSoftMax) return firstCandidate

  const softerCandidate = candidates.find(candidate => {
    const digits = getCandidateFractionDigits(chart, candidate, min, max, maxDecimals)

    return digits >= 0 && digits <= precisionSoftMax
  })

  return softerCandidate || firstCandidate
}

const scalable = (chart, units, min, max, desiredUnits, maxDecimals) => {
  const [scaleKeys, scaleByKey] = getScales(units)

  const config = getUnitConfig(units)
  const base = config.base_unit ?? config.print_symbol ?? units
  const prefix = config.prefix_symbol
  const prefixScale = selfOrExponent(prefix, scaleByKey)

  if (desiredUnits && desiredUnits !== "auto" && desiredUnits !== "original") {
    if (scaleByKey[desiredUnits] !== undefined) {
      return makeScalableCandidate(desiredUnits, scaleByKey, prefixScale, base)
    }
  }

  const delta = getRangeDelta(min, max) * prefixScale
  const scale = [...scaleKeys].reverse().find(scale => delta >= selfOrExponent(scale, scaleByKey))
  const scaleIndex = Math.max(scaleKeys.indexOf(scale), 0)
  const candidateKeys = scaleKeys.slice(0, scaleIndex + 1).reverse()
  const candidates = candidateKeys.map(scale =>
    makeScalableCandidate(scale, scaleByKey, prefixScale, base)
  )

  return choosePrecisionCandidate(chart, candidates, min, max, maxDecimals)
}

const conversable = (chart, units, min, max, desiredUnits, maxDecimals) => {
  const scales = conversableUnits[units]

  if (desiredUnits && desiredUnits !== "auto" && desiredUnits !== "original") {
    return desiredUnits in scales
      ? [makeConversableKey(units, desiredUnits), undefined, desiredUnits]
      : ["original"]
  }

  if (desiredUnits === "original") {
    return ["original"]
  }

  const delta = getRangeDelta(min, max)
  const scaleKeys = conversableKeys[units] || Object.keys(scales)
  const scaleIndex = scaleKeys.findIndex(scale => (scales[scale] || 1).check(chart, delta))

  if (scaleIndex === -1) return ["original"]

  const candidates = scaleKeys
    .slice(0, scaleIndex + 1)
    .reverse()
    .map(key => [makeConversableKey(units, key), null, "", key])

  return choosePrecisionCandidate(chart, candidates, min, max, maxDecimals)
}

const getMethod = (chart, units, min, max, maxDecimals) => {
  if (!isScalable(units)) return ["original"]

  const allUnits = chart.getAttribute("units")
  const desiredUnitsArray = chart.getAttribute("desiredUnits") || ["auto"]
  const unitIndex = allUnits.indexOf(units)
  const desiredUnits = unitIndex >= 0 ? desiredUnitsArray[unitIndex] || "auto" : "auto"

  if (desiredUnits === "original") {
    return ["original"]
  }

  if (conversableUnits[units]) return conversable(chart, units, min, max, desiredUnits, maxDecimals)

  return scalable(chart, units, min, max, desiredUnits, maxDecimals)
}

export const getConversionAttributes = (chart, unit, { min, max, maxDecimals = precisionHardMax }) => {
  const [method, divider, prefix = "", base = ""] = getMethod(chart, unit, min, max, maxDecimals)

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
