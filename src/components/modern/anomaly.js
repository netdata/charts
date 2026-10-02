import { getRowPointValue } from "@/sdk/makeChart/getPointValue"
import { isVisibleDimension } from "@/chartLibraries/helpers/dimensionVisibility"

export const isAnomalous = rate => rate > 0

export const formatAnomalyRate = rate => (rate < 1 ? rate.toFixed(1) : `${Math.round(rate)}`)

const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))

const mix = (a, b, t) => a.map((value, i) => Math.round(value + (b[i] - value) * t))

export const getAnomalyColor = (chart, rate, alpha = 1) => {
  const low = toRgb(chart.getThemeAttribute("themeAnomalyRampLow"))
  const high = toRgb(chart.getThemeAttribute("themeAnomalyRampHigh"))
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
  if (!all?.length) return { peak: 0, periods: 0, peakRow: -1, anomalousRows: 0 }

  const columns = getAnomalyColumns(chart)
  let peak = 0
  let periods = 0
  let peakRow = -1
  let anomalousRows = 0
  let inside = false

  for (let row = 0; row < all.length; row++) {
    const rate = all[row] ? getRowAnomalyRate(all[row], columns, point) : 0
    const anomalous = isAnomalous(rate)
    if (anomalous && !inside) periods++
    if (anomalous) anomalousRows++
    if (anomalous && rate > peak) {
      peak = rate
      peakRow = row
    }
    inside = anomalous
  }

  return { peak, periods, peakRow, anomalousRows }
}
