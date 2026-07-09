import { isBinary } from "@/helpers/units"

const decimalMultipliers = [1, 2, 2.5, 5, 10]
const binaryMultipliers = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024]
const durationUnitsInSeconds = {
  ns: 1e-9,
  us: 1e-6,
  ms: 1e-3,
  s: 1,
}

const durationStepsInSeconds = [
  1e-9,
  2e-9,
  5e-9,
  10e-9,
  20e-9,
  50e-9,
  100e-9,
  200e-9,
  500e-9,
  1e-6,
  2e-6,
  5e-6,
  10e-6,
  20e-6,
  50e-6,
  100e-6,
  200e-6,
  500e-6,
  1e-3,
  2e-3,
  5e-3,
  10e-3,
  20e-3,
  50e-3,
  100e-3,
  200e-3,
  500e-3,
  1,
  2,
  5,
  10,
  15,
  30,
  60,
  120,
  300,
  600,
  900,
  1800,
  2700,
  3600,
  5400,
  7200,
  10800,
  14400,
  21600,
  43200,
  86400,
  172800,
  604800,
  1209600,
  2592000,
  7776000,
  15552000,
  31536000,
]

const getMaxTicks = ({ pixels, pixelsPerTick, minPixelsPerTick = pixelsPerTick }) =>
  Math.max(2, Math.ceil(pixels / Math.max(pixelsPerTick || 1, minPixelsPerTick || 1)))

const getPrecision = step => {
  if (!isFinite(step) || step === 0) return 0

  const exponent = Math.floor(Math.log10(Math.abs(step)))
  return Math.max(0, -exponent + 6)
}

const roundToStepPrecision = (value, step) => {
  const precision = getPrecision(step)
  const multiplier = Math.pow(10, precision)

  return Math.round(value * multiplier) / multiplier
}

const getTickCount = ({ min, max, step }) => {
  if (!isFinite(min) || !isFinite(max) || !isFinite(step) || step === 0) return 0

  const low = Math.min(min, max)
  const high = Math.max(min, max)
  const start = Math.floor(low / step) * step
  const end = Math.ceil(high / step) * step
  const count = Math.round((end - start) / step)

  return count + 1
}

const makeTicks = ({ min, max, step }) => {
  if (!isFinite(min) || !isFinite(max) || !isFinite(step) || step === 0) return []

  const reversed = max < min
  const low = Math.min(min, max)
  const high = Math.max(min, max)
  const start = Math.floor(low / step) * step
  const end = Math.ceil(high / step) * step
  const count = Math.round((end - start) / step)
  const ticks = []

  if (count > 1000) return ticks

  for (let index = 0; index <= count; index++) {
    ticks.push(roundToStepPrecision(start + index * step, step))
  }

  return reversed ? ticks.reverse() : ticks
}

const makeNumericStep = ({ range, maxTicks, base, multipliers }) => {
  if (!isFinite(range) || range <= 0) return 1

  const minimumStep = range / maxTicks
  const basePower = Math.floor(Math.log(minimumStep) / Math.log(base))

  for (let power = basePower; power <= basePower + 2; power++) {
    const baseScale = Math.pow(base, power)
    const step = multipliers.find(multiplier => multiplier * baseScale >= minimumStep)

    if (step) return step * baseScale
  }

  return Math.pow(base, basePower + 2)
}

const makeNumericTicks = ({ min, max, pixels, pixelsPerTick, units }) => {
  const binary = isBinary(units?.[0])
  const maxTicks = getMaxTicks({ pixels, pixelsPerTick })
  const range = Math.abs(max - min)
  const step = makeNumericStep({
    range,
    maxTicks,
    base: binary ? 1024 : 10,
    multipliers: binary ? binaryMultipliers : decimalMultipliers,
  })

  return makeTicks({ min, max, step })
}

const getDurationUnit = units => {
  if (!units?.length) return null
  const durationUnits = units.filter(unit => durationUnitsInSeconds[unit])

  if (durationUnits.length !== units.length) return null

  const [firstUnit] = durationUnits
  return durationUnits.every(unit => unit === firstUnit) ? firstUnit : null
}

export const isDurationAxis = ({ secondsAsTime = true, units = [] } = {}) =>
  Boolean(secondsAsTime && getDurationUnit(units))

const makeDurationTicks = ({ min, max, pixels, pixelsPerTick, units }) => {
  const unit = getDurationUnit(units)
  if (!unit) return null

  const maxTicks = getMaxTicks({ pixels, pixelsPerTick, minPixelsPerTick: 40 })
  const unitSeconds = durationUnitsInSeconds[unit]
  const rangeInSeconds = Math.abs(max - min) * unitSeconds
  const yearInSeconds = 365 * 86400
  const durationSteps =
    rangeInSeconds >= yearInSeconds
      ? durationStepsInSeconds.filter(step => step >= yearInSeconds)
      : durationStepsInSeconds
  const steps = durationSteps.map(step => step / unitSeconds)
  const fallbackStep = makeNumericStep({
    range: Math.abs(max - min),
    maxTicks,
    base: 10,
    multipliers: decimalMultipliers,
  })
  const step =
    steps.find(candidate => getTickCount({ min, max, step: candidate }) <= maxTicks) ||
    fallbackStep

  return makeTicks({ min, max, step })
}

export const makeAxisTicks = ({
  min,
  max,
  pixels,
  pixelsPerTick,
  units = [],
  secondsAsTime = true,
} = {}) => {
  if (!isFinite(min) || !isFinite(max)) return []
  if (min === max) return [{ v: min }]

  const values =
    secondsAsTime && getDurationUnit(units)
      ? makeDurationTicks({ min, max, pixels, pixelsPerTick, units })
      : makeNumericTicks({ min, max, pixels, pixelsPerTick, units })

  return values.map(v => ({ v }))
}
