export default {
  context: "system.io",
  family: "disk",
  title: "Disk I/O (system.io)",
  priority: 150,
  plugin: "proc.plugin",
  module: "/proc/diskstats",
  units: "KiB/s",
  chartType: "area",
  updateEvery: 1,
  firstEntry: 1628899420,
  lastEntry: 1629186631,
  dimensions: {
    in: {
      name: "in",
    },
    out: {
      name: "out",
    },
  },
  chartLabels: {},
}
