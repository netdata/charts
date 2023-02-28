export const getStats = (
  chart,
  obj,
  { id, key, childrenKey, children = [], childProps, props } = {}
) => ({
  label: obj.nm || id || obj.id,
  value: id || obj.id,
  "data-track": chart.track(`${key}-${id || obj.id || obj.nm}`),
  unique: children.length,
  instances: obj.is ? obj.is.qr + obj.is.qr / (obj.is.ex + obj.is.sl) : "-",
  metrics: obj.ds ? obj.ds.qr + obj.ds.qr / (obj.ds.ex + obj.ds.sl) : "-",
  contribution: obj.sts?.con || 0,
  anomalyRate: obj.sts?.arp || 0,
  alerts: obj.al ? obj.al.cr * 3 + obj.al.wr * 2 + obj.al.cl : "-",
  info: obj,
  ...props,
  children: children.map(dim =>
    getStats(chart, dim, { key: `${key}-${childrenKey}`, props: childProps })
  ),
})
