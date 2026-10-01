const severity = { clear: 0, warning: 1, critical: 2 }

const normalizeStatus = status => {
  const value = typeof status === "string" ? status.toLowerCase() : ""
  return value in severity ? value : null
}

const toSeconds = timestamp => {
  if (typeof timestamp === "number") return timestamp
  const ms = new Date(timestamp).getTime()
  return Number.isNaN(ms) ? null : Math.floor(ms / 1000)
}

const latestTransition = (transitions = []) =>
  transitions.reduce((latest, transition) => {
    const at = toSeconds(transition.timestamp)
    if (at === null) return latest
    return !latest || at > latest.when ? { ...transition, when: at } : latest
  }, null)

const fromOverlay = overlay => {
  if (!overlay) return null

  if (overlay.type === "alarm")
    return { status: normalizeStatus(overlay.status), value: overlay.value, when: overlay.when }

  if (overlay.type === "alarmRange")
    return {
      status: normalizeStatus(overlay.status),
      value: overlay.valueTriggered,
      when: overlay.whenTriggered,
    }

  if (overlay.type === "alertTransitions") {
    const last = latestTransition(overlay.transitions)
    if (!last) return null
    return { status: normalizeStatus(last.to), value: last.value, when: last.when }
  }

  return null
}

const pickOverlay = (overlays = {}) =>
  Object.values(overlays)
    .map(fromOverlay)
    .filter(item => item && item.status)
    .reduce(
      (top, item) => (!top || severity[item.status] > severity[top.status] ? item : top),
      null
    )

const fromSummary = (alerts = {}) => {
  const entries = Object.values(alerts)
  if (!entries.length) return null

  const critical = entries.filter(alert => alert.cr > 0).map(alert => alert.nm)
  const warning = entries.filter(alert => alert.wr > 0).map(alert => alert.nm)

  if (critical.length) return { status: "critical", names: [...critical, ...warning] }
  if (warning.length) return { status: "warning", names: warning }
  return { status: "clear", names: [] }
}

export const getAttention = ({ overlays, alerts } = {}) => {
  const overlay = pickOverlay(overlays)
  const summary = fromSummary(alerts)

  if (!overlay && !summary) return null

  const status = [overlay?.status, summary?.status]
    .filter(Boolean)
    .reduce((top, item) => (severity[item] > severity[top] ? item : top), "clear")

  if (status === "clear") return { status }

  const raisedOverlay = overlay && overlay.status !== "clear" ? overlay : null

  return {
    status,
    names: summary?.names || [],
    value: raisedOverlay?.value ?? null,
    when: raisedOverlay?.when ?? null,
  }
}

export default getAttention
