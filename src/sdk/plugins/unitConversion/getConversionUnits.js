import conversableUnits, { makeConversableKey } from "@/sdk/unitConversion/conversableUnits"
import scalableUnits from "@/sdk/unitConversion/scalableUnits"
import convert from "@/sdk/unitConversion"
import unitsJson from "@/units.json"

const isAdditive = u =>
  typeof unitsJson.units[u] !== "undefined" ? unitsJson.units[u].is_additive : true

const scalable = (units, min, max, desiredUnits) => {
  const scales = scalableUnits[units]

  if (desiredUnits !== "auto" && desiredUnits in scales)
    return ["divide", scales[desiredUnits], desiredUnits]

  const absMin = Math.abs(min)
  const absMax = Math.abs(max)
  const delta = absMin > absMax ? absMin : absMax

  const scale = Object.keys(scales)
    .reverse()
    .find(scale => delta >= scales[scale])

  return scale
    ? ["divide", scales[scale], units === "num" ? `${scale} ${desiredUnits}` : scale]
    : ["original"]
}

const conversable = (chart, units, max, desiredUnits) => {
  const scales = conversableUnits[units]

  if (desiredUnits !== "auto") {
    return desiredUnits in scales
      ? [makeConversableKey(units, desiredUnits), undefined, desiredUnits]
      : ["original"]
  }

  const scaleKeys = Object.keys(scales)
  const scaleIndex = scaleKeys.findIndex(scale => scales[scale].check(chart, max))

  if (scaleIndex === -1) return ["original"]

  const key = scaleKeys[scaleIndex]
  return [makeConversableKey(units, key), undefined, key]
}

const getMethod = (chart, units, min, max) => {
  if (!isAdditive(units)) return ["original"]

  const { desiredUnits } = chart.getAttributes()

  if (conversableUnits[units]) return conversable(chart, units, max, desiredUnits)

  if (scalableUnits[units]) return scalable(units, min, max, desiredUnits)

  if (units === "percentage" || units === "percent" || units === "pcent" || /%/.test(units || ""))
    return ["original"]

  return scalable("num", min, max, units)
}

const decimals = [1000, 100, 10, 1, 0.1, 0.01, 0.001]

const getFractionDigits = value => {
  const index = decimals.findIndex(d => value > d)
  const digits = index === -1 ? decimals.length - 1 : index
  return digits === 3 ? 2 : digits
}

const getConversionUnits = (chart, unitsKey, min, max, maxDecimals = 5) => {
  const units = chart.getAttribute(unitsKey)

  const [method, divider, unitsConversion = units] = getMethod(chart, units, min, max)

  const cMin = convert(chart, method, min, divider)
  const cMax = convert(chart, method, max, divider)

  const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)

  const fractionDigits =
    method === "original" || method === "divide" ? getFractionDigits(delta) : -1

  return {
    method,
    divider,
    units: unitsConversion,
    fractionDigits: fractionDigits > maxDecimals ? maxDecimals : fractionDigits,
  }
}

export default getConversionUnits
