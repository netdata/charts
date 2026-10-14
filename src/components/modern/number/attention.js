import { useAttributeValue, useChart } from "@/components/provider"
import { getStatusLabel, summarizeAlerts } from "@/components/modern/status/summary"

const toneByLevel = { critical: "error", warning: "warning" }

export const getAlertState = alerts => {
  const { critical, warning, raisedNames } = summarizeAlerts(alerts)

  if (critical.count)
    return {
      level: "critical",
      count: critical.count,
      tone: toneByLevel.critical,
      names: raisedNames,
    }
  if (warning.count)
    return { level: "warning", count: warning.count, tone: toneByLevel.warning, names: raisedNames }

  return null
}

export const getAlertLabel = ({ level, count }) => getStatusLabel({ status: level, count })

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

  return {
    alert,
    color: alert?.tone || thresholdColor || null,
    watching: summarizeAlerts(alerts).watching,
  }
}
