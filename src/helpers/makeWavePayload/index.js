const now = 1729763970000
const points = 97
const updateEvery = 5

const range = values => ({
  min: Math.min(...values),
  max: Math.max(...values),
  avg: values.reduce((sum, value) => sum + value, 0) / values.length,
})

export const makeWave = ({ center, amplitude, cycles = 2.5, phase = 0, ripple = 0.08 }) =>
  Array.from({ length: points }, (_, index) => {
    const progress = index / (points - 1)
    const primary = Math.sin(progress * Math.PI * 2 * cycles + phase)
    const secondary = Math.sin(progress * Math.PI * 2 * cycles * 0.37 + phase * 0.5)

    return center + amplitude * primary + amplitude * ripple * secondary
  })

const makeAnomalyRates = seed =>
  Array.from({ length: points }, (_, index) =>
    (index + seed * 7) % 47 === 0 ? 35 + ((index * 17 + seed * 11) % 65) : 0
  )

const makeDimensionStats = dimensions =>
  dimensions.reduce(
    (stats, dimension) => {
      const values = range(dimension.values)
      const anomalyRates = dimension.anomalyRates || []

      stats.min.push(values.min)
      stats.max.push(values.max)
      stats.avg.push(values.avg)
      stats.arp.push(anomalyRates.length ? range(anomalyRates).avg : 0)
      stats.con.push(0)
      return stats
    },
    { min: [], max: [], avg: [], arp: [], con: [] }
  )

export const makePayload = ({ context, title, unit, dimensions, chartType = "line" }) => {
  const normalizedDimensions = dimensions.map((dimension, index) => ({
    ...dimension,
    anomalyRates: dimension.anomalyRates || makeAnomalyRates(index + 1),
  }))
  const allValues = normalizedDimensions.flatMap(dimension => dimension.values)
  const values = range(allValues)
  const dimensionStats = makeDimensionStats(normalizedDimensions)
  const ids = normalizedDimensions.map(dimension => dimension.id)
  const names = normalizedDimensions.map(dimension => dimension.name || dimension.id)
  const dimensionUnits = normalizedDimensions.map(dimension => dimension.unit || unit)
  const units = [...new Set(dimensionUnits)]
  const rows = Array.from({ length: points }, (_, index) => [
    now - (points - index - 1) * updateEvery * 1000,
    ...normalizedDimensions.map(dimension => [
      dimension.values[index],
      dimension.anomalyRates[index],
      0,
    ]),
  ])

  return {
    api: 2,
    versions: {},
    summary: {
      nodes: [],
      contexts: [{ id: context, sts: { ...values, con: 100 } }],
      instances: [],
      dimensions: normalizedDimensions.map((dimension, index) => ({
        id: dimension.id,
        pri: index,
        sts: {
          min: dimensionStats.min[index],
          max: dimensionStats.max[index],
          avg: dimensionStats.avg[index],
          con: 0,
        },
      })),
      labels: [],
      alerts: [],
    },
    totals: {},
    functions: [],
    result: {
      labels: ["time", ...names],
      point: { value: 0, arp: 1, pa: 2 },
      data: rows,
    },
    db: {
      tiers: 1,
      update_every: updateEvery,
      first_entry: Math.floor(rows[0][0] / 1000),
      last_entry: Math.floor(rows[rows.length - 1][0] / 1000),
      units,
      dimensions: { ids, units: dimensionUnits, sts: dimensionStats },
      per_tier: [],
    },
    view: {
      title,
      update_every: updateEvery,
      after: Math.floor(rows[0][0] / 1000),
      before: Math.floor(rows[rows.length - 1][0] / 1000),
      units,
      chart_type: chartType,
      dimensions: {
        grouped_by: ["dimension"],
        ids,
        names,
        units: dimensionUnits,
        priorities: normalizedDimensions.map((_, index) => index),
        aggregated: normalizedDimensions.map(() => 1),
        sts: dimensionStats,
      },
      ...values,
    },
  }
}
