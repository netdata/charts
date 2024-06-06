import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

const seconds2time = (seconds, maxTimeUnit, minTimeUnit = "MS") => {
  // todo maybe we should resign from MS, if we're only showing zeroes. we just need to properly
  // annotate units in this case (not to show "HH:MM:SS.ms")
  let secondsReturn = Math.abs(seconds)

  const years = Math.floor(secondsReturn / (86_400 * 365))
  const yearsString = maxTimeUnit === "YEARS" ? `${years}yr` : ""

  secondsReturn -= years * (86_400 * 365)

  const months = Math.floor(secondsReturn / (86_400 * 30))
  const monthsString = maxTimeUnit === "MONTHS" ? `${months}mo` : ""

  secondsReturn -= months * (86_400 * 30)

  const days = Math.floor(secondsReturn / 86_400)
  const daysString = maxTimeUnit === "DAYS" ? `${days}d` : ""

  if (maxTimeUnit === "YEARS") return `${yearsString}:${monthsString}:${daysString}`

  secondsReturn -= days * 86_400

  const hours = Math.floor(secondsReturn / 3_600)
  const hoursString = zeropad(hours)

  if (maxTimeUnit === "MONTHS") return `${monthsString}:${daysString} ${hoursString}`

  secondsReturn -= hours * 3_600

  const minutes = Math.floor(secondsReturn / 60)
  const minutesString = zeropad(minutes)

  if (maxTimeUnit === "DAYS") return `${daysString} ${hoursString}:${minutesString}`

  secondsReturn -= minutes * 60

  const secondsString = zeropad(
    minTimeUnit === "MS" ? secondsReturn.toFixed(2) : Math.round(secondsReturn)
  )

  if (maxTimeUnit === "HOURS") return `${hoursString}:${minutesString}:${secondsString}`

  if (maxTimeUnit === "MINUTES") return `${minutesString}:${secondsString}`

  return `${secondsString}s`
}

const twoFixed =
  (multiplier = 1) =>
  value =>
    value * multiplier

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
    us: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1,
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
    us: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 0.001,
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
