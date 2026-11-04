const dateIntlOptions = {
  hourCycle: "h23",
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "2-digit",
}

const dateIntlAxisXOptions = {
  hourCycle: "h23",
  month: "2-digit",
  day: "2-digit",
}

const timeIntlOptions = {
  hourCycle: "h23",
  timeStyle: "medium",
}

const shortTimeIntlOptions = {
  hourCycle: "h23",
  timeStyle: "short",
}

const zeropad = x => (x > -10 && x < 10 ? `0${x.toString()}` : x.toString())

export const resolveXAxisTimeStyle = (timeStyle, hasSubMinuteTicks) => {
  if (timeStyle === "auto") return hasSubMinuteTicks ? "medium" : "short"
  return timeStyle === "short" ? "short" : "medium"
}

export default () => {
  let timeIntl
  let shortTimeIntl
  let dateIntlAxisX
  let dateIntl

  const makeIntlFormatters = (timeZone, locale) => {
    const resolvedLocale = locale || navigator.language
    timeIntl = new Intl.DateTimeFormat(resolvedLocale, { ...timeIntlOptions, timeZone })
    shortTimeIntl = new Intl.DateTimeFormat(resolvedLocale, { ...shortTimeIntlOptions, timeZone })
    dateIntl = new Intl.DateTimeFormat(resolvedLocale, { ...dateIntlOptions, timeZone })
    dateIntlAxisX = new Intl.DateTimeFormat(resolvedLocale, {
      ...dateIntlAxisXOptions,
      timeZone,
    })
  }

  const makeNativeFormatters = () => {
    dateIntl = { format: date => new Date(date).toLocaleDateString() }
    timeIntl = { format: date => new Date(date).toLocaleTimeString() }
    shortTimeIntl = {
      format: date => {
        const dd = new Date(date)
        return [dd.getHours(), dd.getMinutes()].map(zeropad).join(":")
      },
    }
    dateIntlAxisX = {
      format: date => {
        const dd = new Date(date)
        return [dd.getHours(), dd.getMinutes(), dd.getSeconds()].map(zeropad).join(":")
      },
    }
  }

  const update = (timeZone, locale) => {
    try {
      makeIntlFormatters(timeZone, locale)
    } catch (e) {
      makeNativeFormatters()
    }
  }

  const formatTime = date => timeIntl.format(date)
  const formatDate = date => dateIntl.format(date)

  const formatXAxis = (date, timeStyle) => {
    const midnight = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    if (midnight) return dateIntlAxisX.format(date)
    return timeStyle === "short" ? shortTimeIntl.format(date) : formatTime(date)
  }

  const destroy = () => {
    timeIntl = null
    shortTimeIntl = null
    dateIntlAxisX = null
    dateIntl = null
  }

  return { update, formatTime, formatDate, formatXAxis, destroy }
}
