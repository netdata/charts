import { getDateDiff } from "@/components/line/indicators"

const dayKeyOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
const shortDateOptions = { weekday: "short", day: "2-digit", month: "short" }

const makeFormatter = (chart, options) => {
  const timeZone = chart.getAttribute("timezone")
  const locale = chart.getAttribute("locale") || undefined

  try {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone })
  } catch {
    return new Intl.DateTimeFormat(undefined, options)
  }
}

export const getDayKey = (chart, ms) => makeFormatter(chart, dayKeyOptions).format(ms)

// "Wed 30 Sep": the locale's order, without the separating commas, so it reads as one token
export const formatShortDate = (chart, ms) =>
  makeFormatter(chart, shortDateOptions)
    .formatToParts(ms)
    .map(part => (part.type === "literal" ? part.value.replace(/,/g, "") : part.value))
    .join("")
    .replace(/\s+/g, " ")
    .trim()

// after/before are in seconds, like the highlight overlay range
export const formatCompactRange = (chart, after, before, now = Date.now()) => {
  const afterMs = after * 1000
  const beforeMs = before * 1000
  const today = getDayKey(chart, now)
  const afterDay = getDayKey(chart, afterMs)
  const beforeDay = getDayKey(chart, beforeMs)
  const afterTime = chart.formatTime(afterMs)
  const beforeTime = chart.formatTime(beforeMs)
  const duration = getDateDiff(after, before).join("")

  let range
  if (afterDay !== beforeDay) {
    range = `${formatShortDate(chart, afterMs)}, ${afterTime}–${formatShortDate(
      chart,
      beforeMs
    )}, ${beforeTime}`
  } else if (afterDay === today) {
    range = `${afterTime}–${beforeTime}`
  } else {
    range = `${formatShortDate(chart, afterMs)}, ${afterTime}–${beforeTime}`
  }

  return duration ? `${range} ${duration}` : range
}
