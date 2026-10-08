export const makeHeatmapMetadata = chart => {
  const dimensionIds = chart.getPayloadDimensionIds()
  const visibleIds = chart.getVisibleHeatmapIds()
  const visibleRanks = new Map(visibleIds.map((id, rank) => [id, rank]))
  const metadata = new Float32Array(dimensionIds.length * 4)

  dimensionIds.forEach((id, index) => {
    const rank = visibleRanks.get(id)
    metadata.set([rank ?? -1, visibleIds.length, 0, rank === undefined ? 0 : 1], index * 4)
  })

  return metadata
}
