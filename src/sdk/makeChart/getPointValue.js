export const getPointValue = (cell, point, valueKey = "value") => {
  if (cell === null || typeof cell !== "object")
    return valueKey === "value" ? cell : undefined

  if (Array.isArray(cell)) {
    const valueIndex = point?.[valueKey]
    return typeof valueIndex === "number" ? cell[valueIndex] : undefined
  }

  return cell[valueKey]
}

export const getRowPointValue = (row, index, point, valueKey = "value") =>
  getPointValue(row?.[index], point, valueKey)
