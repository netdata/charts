export const makeHeatmapPayload = (ids, rows, { timestamp = 1000 } = {}) => {
  const emptyStats = ids.map(() => 0)
  const priorities = ids.map((_, index) => index)

  return {
    api: 2,
    summary: {
      nodes: [{ mg: "node-1", nd: "node-1", nm: "node-1", ni: 0 }],
      contexts: [{ id: "prometheus.test.histogram", sts: { min: 0, max: 3, avg: 0, con: 0 } }],
      instances: [],
      dimensions: ids.map((id, index) => ({
        id,
        pri: index,
        sts: { min: 0, max: 3, avg: 0, con: 0 },
      })),
      labels: [],
      alerts: [],
    },
    db: {
      update_every: 1,
      first_entry: 1,
      last_entry: 2,
    },
    view: {
      title: "Heatmap",
      update_every: 1,
      units: "requests/s",
      chart_type: "heatmap",
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names: ids,
        units: ids.map(() => "requests/s"),
        priorities,
        aggregated: ids.map(() => 1),
        sts: {
          min: emptyStats,
          max: emptyStats,
          avg: emptyStats,
          arp: emptyStats,
          con: emptyStats,
        },
      },
      min: 0,
      max: 3,
    },
    result: {
      labels: ["time", ...ids],
      point: { value: 0, arp: 1, pa: 2 },
      data: rows.map((values, index) => [
        timestamp + index * 1000,
        ...values.map(value => [value, 0, 0]),
      ]),
    },
  }
}

export const loadHeatmapPayload = async (chart, ids, rows, options) => {
  chart.doneFetch(makeHeatmapPayload(ids, rows, options))
  await new Promise(resolve => setTimeout(resolve, 0))
}
