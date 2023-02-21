export default {
  fullyLoaded: false,
  loaded: false,
  id: "",
  title: "",

  chartType: "",
  context: "",
  contexts: [],

  viewDimensions: {
    ids: [],
    names: [],
    latestValues: [],
    count: 0,
    priorities: [],
    algorithm: "absolute", // absolute|incremental
  },

  // view
  units: "",
  viewUpdateEvery: 0, // view.update_every

  // db
  updateEvery: 0,
  firstEntry: 0,
  lastEntry: 0,

  // summary
  dimensions: [],
  labels: [],
  hosts: [],
  instances: [],
  alerts: [],
}
