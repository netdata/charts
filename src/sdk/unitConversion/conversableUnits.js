import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

const fahrenheit = {
  check: chart => chart.getAttribute("temperature") === "fahrenheit",
  convert: value => (value * 9) / 5 + 32,
}

const seconds2time = (seconds, maxTimeUnit, minTimeUnit = "MS") => {
  // todo maybe we should resign from MS, if we're only showing zeroes. we just need to properly
  // annotate units in this case (not to show "HH:MM:SS.ms")
  let secondsReturn = Math.abs(seconds)

  const days = maxTimeUnit === "DAYS" ? Math.floor(secondsReturn / 86400) : 0
  secondsReturn -= days * 86400

  const hours =
    maxTimeUnit === "DAYS" || maxTimeUnit === "HOURS" ? Math.floor(secondsReturn / 3600) : 0
  secondsReturn -= hours * 3600

  const minutes = Math.floor(secondsReturn / 60)
  secondsReturn -= minutes * 60

  const daysString = maxTimeUnit === "DAYS" ? `${days}d:` : ""
  const hoursString = maxTimeUnit === "DAYS" || maxTimeUnit === "HOURS" ? `${zeropad(hours)}:` : ""
  const minutesString = `${zeropad(minutes)}:`
  const secondsString = zeropad(
    minTimeUnit === "MS" ? secondsReturn.toFixed(2) : Math.round(secondsReturn)
  )

  return `${daysString}${hoursString}${minutesString}${secondsString}`
}

const twoFixed =
  (multiplier = 1) =>
  value =>
    (value * multiplier).toFixed(2)

export default {
  Celsius: {
    Fahrenheit: fahrenheit,
  },
  celsius: {
    fahrenheit: fahrenheit,
  },
  milliseconds: {
    microseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1,
      convert: twoFixed(1000),
    },
    milliseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 1000,
      convert: twoFixed(),
    },
    seconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1000 && max < 60000,
      convert: twoFixed(0.001),
    },
    "MM:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 60000 && max < 3600_000,
      convert: value => seconds2time(value / 1000, "MINUTES"),
    },
    "HH:MM:SS.ms": {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 3600_000 && max < 86_400_000,
      convert: value => seconds2time(value / 1000, "HOURS"),
    },
    "dHH:MM:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000,
      convert: value => seconds2time(value / 1000, "DAYS"),
    },
  },

  seconds: {
    microseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 0.001,
      convert: twoFixed(1000_000),
    },
    milliseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 0.001 && max < 1,
      convert: twoFixed(1000),
    },
    seconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 60,
      convert: twoFixed(1),
    },
    "MM:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 60 && max < 3600,
      convert: value => seconds2time(value, "MINUTES"),
    },
    "HH:MM:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 3600 && max < 86_400,
      convert: value => seconds2time(value, "HOURS"),
    },
    "dHH:MM:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400,
      convert: value => seconds2time(value, "DAYS"),
    },
    "dHH:MM:ss": {
      check: () => false, // only accepting desiredUnits
      convert: value => seconds2time(value, "DAYS", "SECONDS"),
    },
  },
  // todo as seconds and milliseconds
  nanoseconds: {
    nanoseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1000,
      convert: function (nanoseconds) {
        let tms = Math.round(nanoseconds * 10)
        nanoseconds = Math.floor(tms / 10)

        tms -= nanoseconds * 10

        return `${nanoseconds}.${zeropad(tms)}`
      },
    },
    microseconds: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 1000 && max < 1000 * 1000,
      convert: function (nanoseconds) {
        nanoseconds = Math.round(nanoseconds)

        let microseconds = Math.floor(nanoseconds / 1000)
        nanoseconds -= microseconds * 1000

        nanoseconds = Math.round(nanoseconds / 10)

        return `${microseconds}.${zeropad(nanoseconds)}`
      },
    },
    milliseconds: {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 1000 * 1000 && max < 1000 * 1000 * 1000,
      convert: function (nanoseconds) {
        nanoseconds = Math.round(nanoseconds)

        let milliseconds = Math.floor(nanoseconds / 1000 / 1000)
        nanoseconds -= milliseconds * 1000 * 1000

        nanoseconds = Math.round(nanoseconds / 1000 / 10)

        return `${milliseconds}.${zeropad(nanoseconds)}`
      },
    },
    seconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1000 * 1000 * 1000,
      convert: nanoseconds => {
        nanoseconds = Math.round(nanoseconds)

        let seconds = Math.floor(nanoseconds / 1000 / 1000 / 1000)
        nanoseconds -= seconds * 1000 * 1000 * 1000

        nanoseconds = Math.round(nanoseconds / 1000 / 1000 / 10)

        return `${seconds}.${zeropad(nanoseconds)}`
      },
    },
  },
}
