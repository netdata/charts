export const getArea = (dygraph, range) => {
  const [after, before] = dygraph.xAxisRange()
  const afterTimestamp = after
  const beforeTimestamp = before

  const [hAfter, hBefore] = range
  const hAfterTimestamp = hAfter * 1000
  const hBeforeTimestamp = hBefore * 1000

  if (hBeforeTimestamp < afterTimestamp || hAfterTimestamp > beforeTimestamp) return null

  const fromX = Math.max(afterTimestamp, hAfterTimestamp)
  const toX = Math.min(beforeTimestamp, hBeforeTimestamp)

  const from = dygraph.toDomXCoord(fromX)
  const to = dygraph.toDomXCoord(toX)
  const width = to - from

  return { from, to, width }
}

export const trigger = (chartUI, id, area) =>
  requestAnimationFrame(() => chartUI.trigger(`overlayedAreaChanged:${id}`, area))
