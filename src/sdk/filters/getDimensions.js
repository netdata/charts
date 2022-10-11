const byNodeDefaultDimensions = {
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

const groupsWithCustomLogic = {
  node: true,
  chart: true,
  _collect_job: true,
}

const sumOfAbsForAll = {
  stacked: true,
  area: true,
}

export default (chart, groupBy) => {
  const { dimensions: allDimensions, id, chartType } = chart.getMetadata()
  const dimensionsArray =
    !allDimensions || !Object.keys(allDimensions).length ? [] : Object.keys(allDimensions)

  if (groupBy === "dimension") return []

  if (groupBy in groupsWithCustomLogic) {
    if (id in byNodeDefaultDimensions) return [byNodeDefaultDimensions[id]]
    return chartType in sumOfAbsForAll ? [] : [dimensionsArray[0]]
  }

  return dimensionsArray
}
