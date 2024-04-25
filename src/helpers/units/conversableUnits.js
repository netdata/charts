import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

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
  Cel: {
    "[degF]": {
      check: chart => chart.getAttribute("temperature") === "fahrenheit",
      convert: value => (value * 9) / 5 + 32,
    },
  },
  s: {
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
  },
}
