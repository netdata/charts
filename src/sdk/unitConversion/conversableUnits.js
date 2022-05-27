import zeropad from "@/helpers/zeropad"

export const makeConversableKey = (unit, scale) => `${unit}-${scale}`

const fahrenheit = {
  check: chart => chart.getAttribute("temperature") === "fahrenheit",
  convert: value => (value * 9) / 5 + 32,
}

export const leaveAtLeast1Decimal = number => {
  const decimalPortion = `${number}`.split(".")[1]
  if (decimalPortion && decimalPortion.length > 1) {
    return `${number}`
  }

  let tms = number * 10
  const integer = Math.floor(tms / 10)

  tms -= integer * 10
  return `${integer}.${tms}`
}

const seconds2time = seconds => {
  let secondsReturn = Math.abs(seconds)

  const days = Math.floor(secondsReturn / 86400)
  secondsReturn -= days * 86400

  const hours = Math.floor(secondsReturn / 3600)
  secondsReturn -= hours * 3600

  const minutes = Math.floor(secondsReturn / 60)
  secondsReturn -= minutes * 60

  const daysString = days ? `${days}d:` : ""
  const hoursString = hours || days ? `${zeropad(hours)}:` : ""
  const minutesString = `${zeropad(minutes)}:`
  const fixedNr = days ? 0 : 3
  let secondsString = days
    ? Math.round(secondsReturn)
    : leaveAtLeast1Decimal(Number(secondsReturn.toFixed(fixedNr)))
  if (minutesString) {
    secondsString = zeropad(secondsString)
  }

  return `${daysString}${hoursString}${minutesString}${secondsString}`
}

export default {
  Celsius: {
    Fahrenheit: fahrenheit,
  },
  celsius: {
    fahrenheit: fahrenheit,
  },
  seconds: {
    milliseconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max < 1,
      convert(seconds) {
        return `${Math.round(seconds * 1000)}`
      },
    },
    seconds: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1 && max < 60,
      convert: value => leaveAtLeast1Decimal(Number(value.toFixed(3))),
    },
    time: {
      check: (chart, max) => chart.getAttribute("secondsAsTime") && max >= 1,
      convert: seconds2time,
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
