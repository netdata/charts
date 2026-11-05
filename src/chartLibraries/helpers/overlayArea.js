export const getArea = (chartUI, range) => {
  const [afterMs, beforeMs] = chartUI.getXAxisRange() || []
  if (afterMs == null || beforeMs == null) return null

  const [hAfter, hBefore] = range
  const hAfterMs = hAfter * 1000
  const hBeforeMs = hBefore * 1000

  if (hBeforeMs < afterMs || hAfterMs > beforeMs) return null

  const from = chartUI.getXCoord(Math.max(afterMs, hAfterMs))
  const to = chartUI.getXCoord(Math.min(beforeMs, hBeforeMs))

  return { from, to, width: to - from }
}
