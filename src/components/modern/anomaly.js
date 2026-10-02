import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { isVisibleDimension } from "@/chartLibraries/helpers/dimensionVisibility"

export const isAnomalous = rate => rate > 0

const ramps = [
  { low: [214, 202, 255], high: [98, 52, 214] },
  { low: [74, 58, 140], high: [196, 160, 255] },
]

const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t))

export const getAnomalyColor = (themeIndex, rate, alpha = 1) => {
  const { low, high } = ramps[themeIndex] || ramps[0]
  const t = Math.min(1, Math.max(0, rate / 50))
  const [r, g, b] = mix(low, high, Math.sqrt(t))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const getAnomalyColumns = chart =>
  chart
    .getPayloadDimensionIds()
    .reduce((acc, id, index) => (isVisibleDimension(chart, id) ? acc.concat(index + 1) : acc), [])

export const getRowAnomalyRate = (pointData, columns, point) => {
  let value = 0
  for (let i = 0; i < columns.length; i++) {
    const rate = getRowPointValue(pointData, columns[i], point, "arp") || 0
    if (rate > value) value = rate
  }
  return value
}

export const getAnomalySummary = chart => {
  const { all, point } = chart.getPayload()
  if (!all?.length) return { peak: 0, periods: 0 }

  const columns = getAnomalyColumns(chart)
  let peak = 0
  let periods = 0
  let inside = false

  for (let row = 0; row < all.length; row++) {
    const rate = all[row] ? getRowAnomalyRate(all[row], columns, point) : 0
    const anomalous = isAnomalous(rate)
    if (anomalous && !inside) periods++
    if (anomalous && rate > peak) peak = rate
    inside = anomalous
  }

  return { peak, periods }
}
