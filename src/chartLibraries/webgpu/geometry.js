export const makeDrawLayout = ({ pointCount, seriesCount, stepped }) => {
  const pairsPerSeries = Math.max(0, pointCount - 1)
  const segmentsPerPair = stepped ? 2 : 1
  const segmentsPerSeries = pairsPerSeries * segmentsPerPair

  return {
    pairsPerSeries,
    segmentsPerPair,
    segmentsPerSeries,
    instanceCount: segmentsPerSeries * seriesCount,
  }
}
