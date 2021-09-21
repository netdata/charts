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

  const makeIntlFormatters = timeZone => {
    timeIntl = new Intl.DateTimeFormat(navigator.language, { ...timeIntlOptions, timeZone })
    dateIntl = new Intl.DateTimeFormat(navigator.language, { ...dateIntlOptions, timeZone })
    dateIntlAxisX = new Intl.DateTimeFormat(navigator.language, {
      ...dateIntlAxisXOptions,
      timeZone,
    })
  }

  const makeNativeFormatters = () => {
    dateIntl = { format: date => date.toLocaleDateString() }
    timeIntl = { format: date => date.toLocaleTimeString() }
    dateIntlAxisX = {
      format: date =>
        [date.getHours(), date.getMinutes(), date.getSeconds()].map(zeropad).join(":"),
    }
  }

  const update = timeZone => {
    try {
      makeIntlFormatters(timeZone)
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
