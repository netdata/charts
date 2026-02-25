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

const zeropad = x => (x > -10 && x < 10 ? `0${x.toString()}` : x.toString())

export default () => {
  let timeIntl
  let dateIntlAxisX
  let dateIntl

  const makeIntlFormatters = (timeZone, locale) => {
    const resolvedLocale = locale || navigator.language
    timeIntl = new Intl.DateTimeFormat(resolvedLocale, { ...timeIntlOptions, timeZone })
    dateIntl = new Intl.DateTimeFormat(resolvedLocale, { ...dateIntlOptions, timeZone })
    dateIntlAxisX = new Intl.DateTimeFormat(resolvedLocale, {
      ...dateIntlAxisXOptions,
      timeZone,
    })
  }

  const makeNativeFormatters = () => {
    dateIntl = { format: date => new Date(date).toLocaleDateString() }
    timeIntl = { format: date => new Date(date).toLocaleTimeString() }
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

  const formatXAxis = date => {
    const midnight = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    return midnight ? dateIntlAxisX.format(date) : formatTime(date)
  }

  const destroy = () => {
    timeIntl = null
    dateIntlAxisX = null
    dateIntl = null
  }

  return { update, formatTime, formatDate, formatXAxis, destroy }
}
