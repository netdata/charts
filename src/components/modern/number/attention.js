import { useAttributeValue, useChart } from "@/components/provider"

const toneByLevel = { critical: "error", warning: "warning" }

// The solid tones are the same in both themes, so the ink is fixed per tone: the panel colour
// clears 4.5:1 on warning orange and white clears it on critical red, where the theme background
// colour does not (about 2:1 on warning in light, 3.5:1 on critical in dark).
const inkByTone = { error: "bright", warning: "panel" }

export const getPillInk = tone => inkByTone[tone] || "bright"

// Alert counts come from the query summary (`alerts` attribute, keyed by alert name) and
// describe the state of the whole query, not a single value.
export const getAlertState = alerts => {
  const list = Object.values(alerts || {})
  const critical = list.reduce((sum, alert) => sum + (alert?.cr || 0), 0)
  const warning = list.reduce((sum, alert) => sum + (alert?.wr || 0), 0)

  if (critical) return { level: "critical", count: critical, tone: toneByLevel.critical }
  if (warning) return { level: "warning", count: warning, tone: toneByLevel.warning }

  return null
}

export const getAlertLabel = ({ level, count }) =>
  count > 1 ? `${count} ${level}` : level === "critical" ? "Critical" : "Warning"

// A band that starts at or below the range minimum is the base band, so staying inside it is
// neutral; only crossing into a higher band colours the value.
export const getThresholdColor = (thresholds, value, min, themeIndex = 0) => {
  if (!Array.isArray(thresholds) || typeof value !== "number" || !isFinite(value)) return null

  const rows = thresholds
    .filter(row => row && typeof row.from === "number" && Array.isArray(row.color))
    .sort((a, b) => a.from - b.from)

  let active = null
  rows.forEach(row => {
    if (value >= row.from) active = row
  })

  if (!active) return null
  if (active === rows[0] && typeof min === "number" && active.from <= min) return null

  return active.color[themeIndex] || active.color[0] || null
}

export const useAttention = (value, min) => {
  const chart = useChart()
  const alerts = useAttributeValue("alerts")
  const thresholds = useAttributeValue("gaugeThresholds")
  useAttributeValue("theme")

  const alert = getAlertState(alerts)
  const thresholdColor = getThresholdColor(thresholds, value, min, chart.getThemeIndex())

  return { alert, color: alert?.tone || thresholdColor || null }
}
