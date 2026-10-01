import { PALETTE } from "@/components/toolbox/settings/thresholdRow"

const severityByColor = {
  [PALETTE[0][0].toLowerCase()]: "ok",
  [PALETTE[1][0].toLowerCase()]: "warning",
  [PALETTE[2][0].toLowerCase()]: "critical",
}

const rank = { ok: 0, warning: 1, critical: 2 }

const classify = (row, isBase) => {
  const known = severityByColor[String(row.color[0] || "").toLowerCase()]
  if (known) return known
  return isBase ? "ok" : "warning"
}

export const makeZones = (thresholds, min, max, themeIndex = 0) => {
  if (!Array.isArray(thresholds) || !thresholds.length) return []
  if (typeof min !== "number" || typeof max !== "number" || max <= min) return []

  const rows = thresholds
    .filter(t => t && typeof t.from === "number" && Array.isArray(t.color))
    .filter(t => t.from < max)
    .sort((a, b) => a.from - b.from)
    .reduce((acc, row) => {
      const prev = acc[acc.length - 1]
      if (prev && prev.from === row.from) acc[acc.length - 1] = row
      else acc.push(row)
      return acc
    }, [])

  return rows
    .map((row, index) => {
      const next = rows[index + 1]
      const from = Math.max(row.from, min)
      const to = next ? Math.min(next.from, max) : max
      return {
        id: row.id ?? String(index),
        from,
        to,
        color: row.color[themeIndex] || row.color[0],
        severity: classify(row, index === 0 && row.from <= min),
      }
    })
    .filter(zone => zone.to > zone.from)
}

export const zoneAt = (zones, value) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null
  return (
    zones.find((zone, index) =>
      index === zones.length - 1 ? value >= zone.from : value >= zone.from && value < zone.to
    ) || null
  )
}

export const alertSeverity = alerts => {
  const list = Object.values(alerts || {})
  if (list.some(alert => alert?.cr > 0)) return "critical"
  if (list.some(alert => alert?.wr > 0)) return "warning"
  return "ok"
}

export const worstSeverity = (...severities) =>
  severities.reduce((worst, s) => ((rank[s] ?? 0) > (rank[worst] ?? 0) ? s : worst), "ok")
