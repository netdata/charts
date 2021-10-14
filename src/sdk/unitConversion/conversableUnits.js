import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

const fahrenheit = {
  check: chart => chart.getAttribute("temperature") === "fahrenheit",
  convert: value => (value * 9) / 5 + 32,
}

export default {
  Celsius: {
    Fahrenheit: fahrenheit,
  },
  celsius: {
    fahrenheit: fahrenheit,
  },
  seconds: {
    time: {
      check: chart => chart.getAttribute("secondsAsTime"),
      convert: (value, chart) => {
        const days = Math.floor(value / 86400)
        const time = chart.formatTime(value * 1000)
        return days > 0 ? `${days}d:${time}` : time
      },
    },
  },
  milliseconds: {
    milliseconds: {
      check: (chart, value) => chart.getAttribute("secondsAsTime") && value < 1000,
      convert: milliseconds => {
        let tms = Math.round(milliseconds * 10)
        milliseconds = Math.floor(tms / 10)

        tms -= milliseconds * 10

        return `${milliseconds}.${tms}`
      },
    },
    seconds: {
      check: (chart, value) =>
        chart.getAttribute("secondsAsTime") && value >= 1000 && value < 60000,
      convert: milliseconds => {
        milliseconds = Math.round(milliseconds)

        let seconds = Math.floor(milliseconds / 1000)
        milliseconds -= seconds * 1000

        milliseconds = Math.round(milliseconds / 10)

        return `${seconds}.${zeropad(milliseconds)}`
      },
    },
    "M:SS.ms": {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 60000,
      convert: milliseconds => {
        milliseconds = Math.round(milliseconds)

        let minutes = Math.floor(milliseconds / 60000)
        milliseconds -= minutes * 60000

        let seconds = Math.floor(milliseconds / 1000)
        milliseconds -= seconds * 1000

        milliseconds = Math.round(milliseconds / 10)

        return `${minutes}:${zeropad(seconds)}.${zeropad(milliseconds)}`
      },
    },
  },
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
