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
  "mem.writeback": "dirty",
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
}

const groupsWithCustomLogic = {
  node: true,
  chart: true,
}

export default (chart, groupBy) => {
  const { dimensions, id } = chart.getMetadata()

  if (groupBy === "dimension") return []

  if (groupBy in groupsWithCustomLogic)
    return [byNodeDefaultDimensions[id] || Object.keys(dimensions)[0]]

  return Object.keys(dimensions)
}
