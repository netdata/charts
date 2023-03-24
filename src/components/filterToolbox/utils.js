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

export const getStats = (
  chart,
  obj,
  { id, key, childrenKey, children = [], childProps, props } = {}
) => {
  const { getValue, getIsSelected, ...rest } = props

  return {
    label: obj.nm || id || obj.id,
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
    alerts: getAlertsCount(obj.al),
    info: obj,
    selected: getIsSelected?.(obj) || false,
    ...rest,
    children: children.map(dim =>
      getStats(chart, dim, { key: `${key}-${childrenKey}`, props: childProps })
    ),
  }
}
