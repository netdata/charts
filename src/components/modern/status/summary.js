export const listedNamesLimit = 5

const sumBy = (list, key) => list.reduce((sum, alert) => sum + (alert[key] || 0), 0)

const namesWith = (list, key) =>
  list
    .filter(alert => alert[key] > 0)
    .map(alert => alert.nm)
    .filter(Boolean)

// summary.alerts is keyed by alert name and only holds instance counts per status
export const summarizeAlerts = alerts => {
  const list = Object.values(alerts || {}).filter(Boolean)
  const critical = namesWith(list, "cr")
  const warning = namesWith(list, "wr")

  return {
    watching: list.length,
    critical: { count: sumBy(list, "cr"), names: critical },
    warning: { count: sumBy(list, "wr"), names: warning },
    raisedNames: [...critical, ...warning.filter(name => !critical.includes(name))],
  }
}

export const getStatusLabel = ({ status, count }) => {
  if (typeof count === "number" && count > 0) return `${count} ${status}`
  return status === "critical" ? "Critical" : "Warning"
}

export const getClearDescription = watching =>
  watching > 0
    ? `${watching} ${watching === 1 ? "alert watches" : "alerts watch"} this chart, none is raised`
    : "No alert is raised"

export const capNames = (names = [], limit = listedNamesLimit) => ({
  shown: names.slice(0, limit),
  more: Math.max(0, names.length - limit),
})
