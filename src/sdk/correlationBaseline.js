export const getCorrelationBaseline = ({ after, before }) => {
  const start = Math.floor(after)
  const duration = Math.floor(before) - start
  const multiplier = duration < 3600 ? 4 : duration < 21600 ? 2 : 1
  return { after: start - duration * multiplier, before: start, multiplier }
}

export const getWeightsBaseline = ({
  method = "volume",
  after,
  before,
  baselineAfter,
  baselineBefore,
}) => {
  if (["volume", "ks2"].includes(method || "volume") && Number.isFinite(after) && before > after) {
    const baseline = getCorrelationBaseline(
      after > 0 ? { after, before } : { after: 0, before: before - after }
    )
    return { after: baseline.after, before: baseline.before }
  }
  return { after: Math.floor(baselineAfter), before: Math.floor(baselineBefore) }
}
