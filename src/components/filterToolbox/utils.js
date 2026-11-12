import { getNodeDisplayName } from "@/helpers/nodeDisplayName"

const getValueOrZero = (obj, attr) => (obj ? obj?.[attr] || 0 : 0)

const getMetricsCount = obj => {
  if (!obj) return "-"

  return (
    getValueOrZero(obj, "qr") +
    getValueOrZero(obj, "qr") / (getValueOrZero(obj, "ex") + getValueOrZero(obj, "sl"))
  )
}

const getAlertsCount = obj => {
  if (!obj) return "-"

  return getValueOrZero(obj, "cr") * 3 + getValueOrZero(obj, "wr") * 2 + getValueOrZero(obj, "cl")
}

export const getNodeLabel = (chart, nodeId, node) => {
  const label = getNodeDisplayName(chart, nodeId, node.nm)

  return label !== node.nm ? label : undefined
}

export const getInstanceLabel = (chart, nodeId, node, instance) => {
  const suffix = `@${node.nm}`
  if (!node.nm || !instance.nm?.endsWith(suffix)) return undefined

  const label = getNodeDisplayName(chart, nodeId, node.nm)

  return label !== node.nm ? `${instance.nm.slice(0, -suffix.length)}@${label}` : undefined
}

const includesSearch = (value, search) => {
  const text = value?.toString?.()
  if (typeof text !== "string") return false

  return text.toLowerCase().includes(search)
}

export const matchesRowLabel = (row, columnId, query) => {
  const search = query ? query.toLowerCase() : ""
  const rawLabel = columnId === "label" ? row.original?.rawLabel : undefined
  const found = includesSearch(row.getValue(columnId), search) || includesSearch(rawLabel, search)

  if (!found && row.subRows.length)
    return row.subRows.some(subRow => matchesRowLabel(subRow, columnId, query))

  return found
}

export const getStats = (
  chart,
  obj,
  { id, key, childrenKey, children = [], childProps, props } = {}
) => {
  const { getValue, getLabel, getIsSelected, ...rest } = props

  const aliasLabel = getLabel?.(obj)

  return {
    label: aliasLabel || obj.nm || id || obj.id,
    rawLabel: aliasLabel && !aliasLabel.includes(obj.nm) ? obj.nm : undefined,
    value: getValue?.(obj) || id || obj.id,
    "data-track": chart.track(`${key}-${id || obj.id || obj.nm}`),
    unique: children.length,
    instances: getMetricsCount(obj.is),
    metrics: getMetricsCount(obj.ds),
    contribution: getValueOrZero(obj.sts, "con"),
    anomalyRate: getValueOrZero(obj.sts, "arp"),
    min: getValueOrZero(obj.sts, "min"),
    avg: getValueOrZero(obj.sts, "avg"),
    max: getValueOrZero(obj.sts, "max"),
    range: getValueOrZero(obj.sts, "max") - getValueOrZero(obj.sts, "min"),
    alerts: getAlertsCount(obj.al),
    info: obj,
    selected: getIsSelected?.(obj) || false,
    ...rest,
    children: children.map(dim =>
      getStats(chart, dim, { key: `${key}-${childrenKey}`, props: childProps })
    ),
  }
}
