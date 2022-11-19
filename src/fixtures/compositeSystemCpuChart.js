export default {
  context: "system.cpu",
  family: "cpu",
  title: "Total CPU utilization (system.cpu)",
  priority: 100,
  plugin: "proc.plugin",
  module: "/proc/stat",
  units: "percentage",
  chartType: "heatmap",
  updateEvery: 1,
  firstEntry: 1625969470,
  lastEntry: 1626424323,
  dimensions: {
    guest: { name: "guest123456789101112131415161718192021222324252627282930" },
    guest_nice: { name: "guest_nice" },
    iowait: { name: "iowait" },
    irq: { name: "irq" },
    nice: { name: "nice" },
    softirq: { name: "softirq" },
    steal: { name: "steal" },
    system: { name: "system" },
    user: { name: "user" },
  },
  chartLabels: {},
}

// https://app.netdata.cloud/api/v1/spaces/f0bb93b8-670c-4c49-ad18-492ccc59ab74/rooms/02179f1f-9030-486a-a873-9b57f6420a53/data
// const request = {
//   filter: {
//     nodeIDs: [
//       "c7a9cf8c-1882-11e6-944b-74d435e7ace6",
//       "2f23d2ec-1afa-11e6-a1ad-d05099473bc7",
//       "79dd9dbc-189e-11e6-904a-0401d1165f01",
//       "44bbfb16-827f-11ea-bc9f-b827eb91870b",
//       "9a212702-827f-11ea-abb0-b827ebd78c48",
//     ],
//     context: "system.cpu",
//   },
//   after: -900,
//   before: null,
//   points: 167,
//   group: "average",
//   gtime: 0,
//   agent_options: ["ms", "flip", "jsonwrap", "nonzero"],
//   aggregations: [{ method: "avg", groupBy: ["dimension"] }],
// }
