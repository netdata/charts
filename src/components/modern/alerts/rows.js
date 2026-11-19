export const isRaised = row => row.status === "critical" || row.status === "warning"

const severity = { critical: 2, warning: 1, clear: 0, other: -1 }

const getStatus = ({ cr = 0, wr = 0, cl = 0 }) => {
  if (cr > 0) return "critical"
  if (wr > 0) return "warning"
  if (cl > 0) return "clear"
  return "other"
}

export const toAlertRows = alerts =>
  Object.values(alerts || {})
    .filter(alert => alert?.nm)
    .map(alert => {
      const { nm, cr = 0, wr = 0, cl = 0, ot = 0 } = alert
      return { name: nm, status: getStatus(alert), cr, wr, cl, ot, total: cr + wr + cl + ot }
    })
    .sort((a, b) => severity[b.status] - severity[a.status] || a.name.localeCompare(b.name))

const plural = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`

export const describeCounts = ({ cr, wr, total }) => {
  const raised = [cr && `${cr} critical`, wr && `${wr} warning`].filter(Boolean)
  if (!raised.length) return total > 1 ? `${plural(total, "instance")} clear` : "Clear"
  return total > cr + wr ? `${raised.join(", ")} of ${total}` : raised.join(", ")
}

export const describeRoot = rows => {
  const raised = rows.filter(isRaised)
  if (raised.length) return `${raised.length} raised`
  return rows.length ? "All clear" : "None"
}
