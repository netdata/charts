import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

export const compactDurationUnitKeys = [
  "a:mo:d",
  "mo:d:h",
  "d:h:mm",
  "h:mm:ss",
  "mm:ss",
  "dHH:MM:ss",
]

export const isCompactDurationUnit = unit => compactDurationUnitKeys.includes(unit)

const seconds2time = (seconds, maxTimeUnit, minTimeUnit = "MS") => {
  const precision = minTimeUnit === "MS" ? 100 : 1
  const durationUnits = [
    ["YEARS", "yr", 86_400 * 365],
    ["MONTHS", "mo", 86_400 * 30],
    ["DAYS", "d", 86_400],
    ["HOURS", "h", 3_600],
    ["MINUTES", "m", 60],
  ]
  const startIndex = durationUnits.findIndex(([unit]) => unit === maxTimeUnit)
  const selectedUnits = durationUnits.slice(startIndex === -1 ? durationUnits.length : startIndex)
  const sign = seconds < 0 ? "-" : ""
  let ticks = Math.round(Math.abs(seconds) * precision)
  const parts = []

  selectedUnits.forEach(([, suffix, secondsPerUnit]) => {
    const unitTicks = secondsPerUnit * precision
    const value = Math.floor(ticks / unitTicks)

    ticks -= value * unitTicks

    if (value) parts.push(`${value}${suffix}`)
  })

  const wholeSeconds = Math.floor(ticks / precision)
  const fraction = ticks - wholeSeconds * precision
  const secondsString = fraction
    ? `${wholeSeconds}s.${fraction.toString().padStart(2, "0")}`
    : `${wholeSeconds}s`

  if (secondsString !== "0s" || !parts.length) parts.push(secondsString)

  return `${sign}${parts.join("")}`
}

const twoFixed =
  (multiplier = 1) =>
  value =>
    value * multiplier

export const keys = {
  Cel: ["[degF]"],
  ns: ["ns", "us", "ms", "s"],
  ms: ["ns", "us", "ms", "s", "a:mo:d", "mo:d:h", "d:h:mm", "h:mm:ss", "mm:ss"],
  s: ["ns", "us", "ms", "s", "a:mo:d", "mo:d:h", "d:h:mm", "h:mm:ss", "mm:ss", "dHH:MM:ss"],
}

export default {
  Cel: {
    "[degF]": {
      check: chart => chart.getAttribute("temperature") === "fahrenheit",
      convert: value => (value * 9) / 5 + 32,
    },
  },
  ns: {
    ns: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1_000,
      convert: function (nanoseconds) {
        let tms = Math.round(nanoseconds * 10)
        nanoseconds = Math.floor(tms / 10)

        tms -= nanoseconds * 10

        return `${nanoseconds}.${zeropad(tms)}`
      },
    },
    us: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 1_000 && max < 1_000 * 1_000,
      convert: function (nanoseconds) {
        nanoseconds = Math.round(nanoseconds)

        let microseconds = Math.floor(nanoseconds / 1_000)
        nanoseconds -= microseconds * 1_000

        nanoseconds = Math.round(nanoseconds / 10)

        return `${microseconds}.${zeropad(nanoseconds)}`
      },
    },
    ms: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 1_000 * 1_000 && max < 1_000 * 1_000 * 1_000,
      convert: function (nanoseconds) {
        nanoseconds = Math.round(nanoseconds)

        let milliseconds = Math.floor(nanoseconds / 1_000 / 1_000)
        nanoseconds -= milliseconds * 1_000 * 1_000

        nanoseconds = Math.round(nanoseconds / 1_000 / 10)

        return `${milliseconds}.${zeropad(nanoseconds)}`
      },
    },
    s: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1_000 * 1_000 * 1_000,
      convert: nanoseconds => {
        nanoseconds = Math.round(nanoseconds)

        let seconds = Math.floor(nanoseconds / 1_000 / 1_000 / 1_000)
        nanoseconds -= seconds * 1_000 * 1_000 * 1_000

        nanoseconds = Math.round(nanoseconds / 1_000 / 1_000 / 10)

        return `${seconds}.${zeropad(nanoseconds)}`
      },
    },
  },
  ms: {
    ns: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 0.001,
      convert: twoFixed(1_000_000),
    },
    us: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 0.001 && max < 1,
      convert: twoFixed(1_000),
    },
    ms: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 1_000,
      convert: twoFixed(),
    },
    s: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1_000 && max < 60_000,
      convert: twoFixed(0.001),
    },
    "mm:ss": {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 60_000 && max < 3_600_000,
      convert: value => seconds2time(value / 1_000, "MINUTES"),
    },
    "h:mm:ss": {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 3_600_000 && max < 86_400_000,
      convert: value => seconds2time(value / 1_000, "HOURS"),
    },
    "d:h:mm": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000,
      convert: value => seconds2time(value / 1_000, "DAYS"),
    },
    "mo:d:h": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000 * 30,
      convert: value => seconds2time(value / 1_000, "MONTHS"),
    },
    "a:mo:d": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000 * 365,
      convert: value => seconds2time(value / 1_000, "YEARS"),
    },
  },
  s: {
    ns: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 0.000_001,
      convert: twoFixed(1_000_000_000),
    },
    us: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 0.000_001 && max < 0.001,
      convert: twoFixed(1000_000),
    },
    ms: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 0.001 && max < 1,
      convert: twoFixed(1000),
    },
    s: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 60,
      convert: twoFixed(1),
    },
    "mm:ss": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 60 && max < 3_600,
      convert: value => seconds2time(value, "MINUTES"),
    },
    "h:mm:ss": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 3_600 && max < 86_400,
      convert: value => seconds2time(value, "HOURS"),
    },
    "d:h:mm": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400,
      convert: value => seconds2time(value, "DAYS"),
    },
    "mo:d:h": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400 * 30,
      convert: value => seconds2time(value, "MONTHS"),
    },
    "a:mo:d": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400 * 365,
      convert: value => seconds2time(value, "YEARS"),
    },
    "dHH:MM:ss": {
      check: () => false, // only accepting desiredUnits
      convert: value => seconds2time(value, "DAYS", "SECONDS"),
    },
  },
}
