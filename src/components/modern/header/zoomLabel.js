const hoursMinutes = text => text.replace(/(\d{1,2}[:.]\d{2})[:.]\d{2}/, "$1")

export const getZoomLabel = ({ after, before, formatTime }) => {
  if (!(after > 0)) return null

  const end = before > after ? before : Date.now() / 1000
  const from = hoursMinutes(formatTime(new Date(after * 1000)))
  const to = hoursMinutes(formatTime(new Date(end * 1000)))

  return `Zoomed to ${from}–${to}`
}

export default getZoomLabel
