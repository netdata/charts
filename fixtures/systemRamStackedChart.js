export default {
  id: "system.ram",
  name: "system.ram",
  type: "system",
  family: "ram",
  context: "system.ram",
  title: "System RAM (system.ram)",
  priority: 200,
  plugin: "proc.plugin",
  module: "/proc/meminfo",
  enabled: true,
  units: "MiB",
  data_url: "/api/v1/data?chart=system.ram",
  chart_type: "stacked",
  duration: 172957,
  first_entry: 1621940082,
  last_entry: 1622113038,
  update_every: 1,
  dimensions: {
    free: {
      name: "free",
    },
    used: {
      name: "used",
    },
    cached: {
      name: "cached",
    },
    buffers: {
      name: "buffers",
    },
  },
  chart_variables: {},
  green: null,
  red: null,
  alarms: {
    ram_in_use: {
      id: 1621449009,
      status: "CLEAR",
      units: "%",
      update_every: 10,
    },
    used_ram_to_ignore: {
      id: 1621449008,
      status: "UNDEFINED",
      units: "MiB",
      update_every: 10,
    },
  },
  chart_labels: {},
}
