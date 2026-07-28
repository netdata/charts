export const getArea = (chartUI, range) => {
  const [afterMs, beforeMs] = chartUI.getXAxisRange() || []
  if (afterMs == null || beforeMs == null) return null

  const [rangeAfter, rangeBefore] = range
  const rangeAfterMs = rangeAfter * 1000
  const rangeBeforeMs = rangeBefore * 1000

  if (rangeBeforeMs < afterMs || rangeAfterMs > beforeMs) return null

  const from = chartUI.getXCoord(Math.max(afterMs, rangeAfterMs))
  const to = chartUI.getXCoord(Math.min(beforeMs, rangeBeforeMs))

  return { from, to, width: to - from }
}
