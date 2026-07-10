export const normalizeSearch = query => (query || "").trim().toLowerCase()

export const matchesSearch = (values, query) => {
  const normalizedQuery = normalizeSearch(query)
  if (!normalizedQuery) return true

  return values.some(value => String(value || "").toLowerCase().includes(normalizedQuery))
}

export const flattenTree = (rows, depth = 0) =>
  rows.flatMap(row => {
    const children = row.children || []
    const flattenedRow = { ...row, children: undefined, searchDepth: depth }
    return [flattenedRow, ...flattenTree(children, depth + 1)]
  })
