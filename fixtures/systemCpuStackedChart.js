export default {
  id: "system.cpu",
  name: "system.cpu",
  type: "system",
  family: "cpu",
  context: "system.cpu",
  title: "Total CPU utilization (system.cpu)",
  priority: 100,
  plugin: "proc.plugin",
  module: "/proc/stat",
  enabled: true,
  units: "percentage",
  data_url: "/api/v1/data?chart=system.cpu",
  chart_type: "stacked",
  duration: 172957,
  first_entry: 1621692291,
  last_entry: 1621865247,
  update_every: 1,
  dimensions: {
    guest_nice: {
      name: "guest_nice",
    },
    guest: {
      name: "guest",
    },
    steal: {
      name: "steal",
    },
    softirq: {
      name: "softirq",
    },
    irq: {
      name: "irq",
    },
    user: {
      name: "user",
    },
    system: {
      name: "system",
    },
    nice: {
      name: "nice",
    },
    iowait: {
      name: "iowait",
    },
  },
  chart_variables: {},
  green: null,
  red: null,
  alarms: {},
  chart_labels: {},
}
