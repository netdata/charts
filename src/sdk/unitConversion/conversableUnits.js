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

  const days = Math.floor(secondsReturn / 86_400)
  const daysString = maxTimeUnit === "DAYS" ? `${days}d` : ""

  secondsReturn -= days * 86_400

  const hours = Math.floor(secondsReturn / 3_600)
  const hoursString = zeropad(hours)

  if (maxTimeUnit === "DAYS") return `${daysString}:${hoursString}`

  secondsReturn -= hours * 3_600

  const minutes = Math.floor(secondsReturn / 60)
  const minutesString = zeropad(minutes)

  if (maxTimeUnit === "HOURS") return `${hoursString}:${minutesString}`

  secondsReturn -= minutes * 60

  const secondsString = zeropad(
    minTimeUnit === "MS" ? secondsReturn.toFixed(2) : Math.round(secondsReturn)
  )

  return `${minutesString}:${secondsString}`
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
      convert: twoFixed(1_000),
    },
    milliseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 1_000,
      convert: twoFixed(),
    },
    seconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1_000 && max < 60_000,
      convert: twoFixed(0.001),
    },
    "duration (minutes, seconds)": {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 60_000 && max < 3_600_000,
      convert: value => seconds2time(value / 1_000, "MINUTES"),
    },
    "duration (hours, minutes)": {
      check: (chart, max) =>
        chart.getAttribute("secondsAsTime") && max >= 3_600_000 && max < 86_400_000,
      convert: value => seconds2time(value / 1_000, "HOURS"),
    },
    "duration (days, hours)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000,
      convert: value => seconds2time(value / 1_000, "DAYS"),
    },
    "duration (months, days)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000 * 30,
      convert: value => seconds2time(value, "DAYS"),
    },
    "duration (years, months)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400_000 * 30 * 12,
      convert: value => seconds2time(value, "DAYS"),
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
    "duration (minutes, seconds)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 60 && max < 3_600,
      convert: value => seconds2time(value, "MINUTES"),
    },
    "duration (hours, minutes)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 3_600 && max < 86_400,
      convert: value => seconds2time(value, "HOURS"),
    },
    "duration (days, hours)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400,
      convert: value => seconds2time(value, "DAYS"),
    },
    "duration (months, days)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400 * 30,
      convert: value => seconds2time(value, "DAYS"),
    },
    "duration (years, months)": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 86_400 * 30 * 12,
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
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1_000,
      convert: function (nanoseconds) {
        let tms = Math.round(nanoseconds * 10)
        nanoseconds = Math.floor(tms / 10)

        tms -= nanoseconds * 10

        return `${nanoseconds}.${zeropad(tms)}`
      },
    },
    microseconds: {
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
    milliseconds: {
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
    seconds: {
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
}
