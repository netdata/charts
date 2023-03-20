import conversableUnits, { makeConversableKey } from "@/sdk/unitConversion/conversableUnits"
import scalableUnits from "@/sdk/unitConversion/scalableUnits"
import convert from "@/sdk/unitConversion"

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
  const { desiredUnits } = chart.getAttributes()

  if (desiredUnits === "original") return ["original"]

  if (conversableUnits[units]) return conversable(chart, units, max, desiredUnits)

  if (scalableUnits[units]) return scalable(units, min, max, desiredUnits)

  return units === "%" || units === "percentage" ? ["original"] : scalable("num", min, max, units)
}

const decimals = [100, 10, 1, 0.1, 0.01, 0.001, 0.0001, 0.0001, 0.00001, 0.000001]

const getFractionDigits = value => {
  const index = decimals.findIndex(d => value > d)
  return index === -1 ? decimals.length - 1 : index
}

const getConversionUnits = (chart, min, max, maxDecimals = 5) => {
  const { units } = chart.getAttributes()

  const [method, divider, unitsConversion = units] = getMethod(chart, units, min, max)

  const cMin = convert(chart, method, min, divider)
  const cMax = convert(chart, method, max, divider)

  const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)

  const fractionDigits = method === "original" || method === "divide" ? getFractionDigits(delta) : 0

  return {
    method,
    divider,
    units: unitsConversion,
    fractionDigits: fractionDigits > maxDecimals ? maxDecimals : fractionDigits,
  }
}

export default getConversionUnits
