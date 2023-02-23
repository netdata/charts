const dimensionsByContext = {
  "system.load": "load1",
  "system.processes": "blocked",
  "system.active_processes": "active",
  "system.ctxt": "switches",
  "system.softnet_stat": "processed",
  "system.entropy": "entropy",
  "system.uptime": "uptime",
  "system.ipc_semaphores": "semaphores",
  "cpu.softnet_stat": "processed",
  "mem.pgfaults": "major",
  "mem.writeback": "Dirty",
  "disks.ops": "reads",
  "disk.svctm": "svctm",
  "disk.mops": "reads",
  "disk.iotime": "reads",
  "ip.tcpconnaborts": "timeouts",
  "ip.tcp_accept_queue": "overflows",
  "ip.ecnpkts": "NoECTP",
  "ipv4.sockstat_sockets": "used",
  "ipv4.tcpsock": "connections",
  "ipv4.sockstat_tcp_sockets": "alloc",
  "ipv4.tcpopens": "active",
  "ipv4.tcperrors": "all",
  "ipv4.sockstat_udp_sockets": "inuse",
  "ipv6.sockstat6_tcp_sockets": "inuse",
  "ipv6.sockstat6_raw_sockets": "inuse",
  "netfilter.conntrack_sockets": "connections",
  "anomaly_detection.anomaly_rate": "anomaly_rate",
  "anomaly_detection.dimensions": "anomalous",
  "anomaly_detection.detector_events": "above_threshold",
  "httpcheck.status": "success",
}

const selectDimensionByGroup = {
  node: true,
  chart: true,
  _collect_job: true,
}

const selectDimensionByChartType = {
  stacked: true,
  area: true,
}

export default (chart, { groupBy, groupByLabel }) => {
  if (groupBy.length > 1) return []
  if (groupBy[0] === "dimension") return []

  const { dimensions } = chart.getMetadata()
  const { contextScope, chartType } = chart.getAttributes()

  const [firstContext] = contextScope

  if (
    groupBy[0] in selectDimensionByGroup ||
    groupByLabel.some(group => !!selectDimensionByGroup[group])
  ) {
    if (dimensionsByContext[firstContext]) return [dimensionsByContext[firstContext]]
    return selectDimensionByChartType[chartType] ? [] : [dimensions[0]]
  }

  return dimensions
}
