export const makeCurveSegments = ({ pointCount, plotWidth, targetPixels = 2 }) => {
  const pairs = Math.max(1, pointCount - 1)
  const spacing = Math.max(0, plotWidth) / pairs
  return Math.max(1, Math.ceil(spacing / targetPixels))
}

export const makeDrawLayout = ({
  pointCount,
  seriesCount,
  stepped,
  smooth = false,
  curveSegments = 1,
}) => {
  const pairsPerSeries = Math.max(0, pointCount - 1)
  const segmentsPerPair = stepped ? 2 : smooth ? Math.max(1, curveSegments) : 1
  const segmentsPerSeries = pairsPerSeries * segmentsPerPair

  return {
    pairsPerSeries,
    segmentsPerPair,
    segmentsPerSeries,
    instanceCount: segmentsPerSeries * seriesCount,
  }
}
