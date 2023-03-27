export default {
  id: "web_log_nginx_iplists.response_time",
  name: "web_log_nginx_iplists.response_time",
  type: "web_log_nginx_iplists",
  family: "timings",
  context: "web_log.response_time",
  title: "Processing Time (web_log_nginx_iplists.response_time)",
  priority: 60003,
  plugin: "python.d.plugin",
  module: "web_log",
  enabled: true,
  units: "milliseconds",
  data_url: "/api/v1/data?chart=web_log_nginx_iplists.response_time",
  chart_type: "area",
  duration: 172957,
  first_entry: 1621940082,
  last_entry: 1622113038,
  update_every: 1,
  dimensions: {
    resp_time_min: {
      name: "min",
    },
    resp_time_max: {
      name: "max",
    },
    resp_time_avg: {
      name: "avg",
    },
  },
  chart_variables: {},
  green: 500,
  red: 1000,
  alarms: {
    web_slow: {
      id: 1621449030,
      status: "CLEAR",
      units: "ms",
      update_every: 10,
    },
    "10m_response_time": {
      id: 1621449029,
      status: "UNDEFINED",
      units: "ms",
      update_every: 30,
    },
  },
  chart_labels: {},
}
