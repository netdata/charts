import conversableUnits, { makeConversableKey } from "@/sdk/unitConversion/conversableUnits"
import scalableUnits from "@/sdk/unitConversion/scalableUnits"
import convert from "@/sdk/unitConversion"

const scalable = (units, min, max, desiredUnits) => {
  const scales = scalableUnits[units]

  if (desiredUnits !== "auto") {
    return desiredUnits in scales ? ["divide", scales[desiredUnits], desiredUnits] : ["original"]
  }

  const absMin = Math.abs(min)
  const absMax = Math.abs(max)
  const delta = absMin > absMax ? absMin : absMax

  const scale = Object.keys(scales)
    .reverse()
    .find(scale => delta > scales[scale])

  return scale ? ["divide", scales[scale], scale] : ["original"]
}

const conversable = (units, max, desiredUnits) => {
  const scales = conversableUnits[units]

  if (desiredUnits !== "auto") {
    return desiredUnits in scales
      ? [makeConversableKey(desiredUnits, scale), scales[desiredUnits], desiredUnits]
      : ["original"]
  }

  const scale = Object.keys(scales).find(scale => scales[scale].check(max))

  return scale ? [makeConversableKey(units, scale), scales[scale], scale] : ["original"]
}

const getMethod = (chart, min, max) => {
  const { units } = chart.getMetadata()
  const { desiredUnits } = chart.getAttributes()

  if (desiredUnits === "original") return ["original"]

  if (scalableUnits[units]) return scalable(units, min, max, desiredUnits)

  if (conversableUnits[units]) return conversable(units, max, desiredUnits)

  return ["original"]
}

const decimals = [1000, 10, 1, 0.1, 0.01, 0.001, 0.0001]

const getFractionDigits = value => {
  const index = decimals.findIndex(d => value > d)
  return index === -1 ? decimals.length : index
}

export default (chart, min, max) => {
  const [method, divider, unit] = getMethod(chart, min, max)

  const cMin = convert(chart, method, min, divider)
  const cMax = convert(chart, method, max, divider)

  const delta = Math.abs(cMin === cMax ? cMin : cMax - cMin)

  const fractionDigits = getFractionDigits(delta)

  return { method, divider, unit, fractionDigits }
}
