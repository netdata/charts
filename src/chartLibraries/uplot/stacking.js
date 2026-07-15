export const getStackBounds = (data, columns, isVisible) => {
  const rows = data.length
  const positive = new Array(rows).fill(0)
  const negative = new Array(rows).fill(0)

  return columns.map((column, index) => {
    if (isVisible && !isVisible(column, index)) return null

    const bounds = new Array(rows)

    for (let row = 0; row < rows; row++) {
      const value = data[row][index + 1]

      if (value == null || !Number.isFinite(value)) {
        bounds[row] = null
        continue
      }

      const negativeValue = value < 0
      const base = negativeValue ? negative[row] : positive[row]
      const end = base + value

      if (negativeValue) negative[row] = end
      else positive[row] = end

      bounds[row] = [base, end]
    }

    return bounds
  })
}

export const getStackValueRange = stackBounds => {
  let min = 0
  let max = 0

  stackBounds.forEach(bounds => {
    if (!bounds) return

    bounds.forEach(bound => {
      if (!bound) return

      if (bound[0] < min) min = bound[0]
      if (bound[1] < min) min = bound[1]
      if (bound[0] > max) max = bound[0]
      if (bound[1] > max) max = bound[1]
    })
  })

  return [min, max]
}
