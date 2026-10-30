const placeholderIds = new Set(["OTHERS", "__hidden_dimensions__", "selected"])
export const unsetValue = "[unset]"

const toLevel = grouped =>
  grouped.startsWith("label:")
    ? { kind: "label", key: grouped.slice("label:".length) }
    : { kind: grouped, key: grouped }

export const getLevels = grouped => (Array.isArray(grouped) ? grouped.map(toLevel) : [])

export const findNode = (nodes, value) => {
  const entry = Object.entries(nodes || {}).find(
    ([, node]) => node.mg === value || node.nd === value
  )
  return entry ? { key: entry[0], node: entry[1] } : null
}

export const getDimensionLabelValue = (viewDimensions, key, index) => {
  const values = viewDimensions?.labels?.[key]?.[index]
  return Array.isArray(values) ? values.find(value => typeof value === "string" && value) : null
}

const splitParts = (id, levels, viewDimensions, index) => {
  const pieces = id.split(",")
  let cursor = 0

  return levels.map((level, levelIndex) => {
    const known =
      level.kind === "label" ? getDimensionLabelValue(viewDimensions, level.key, index) : null
    const isLast = levelIndex === levels.length - 1
    const size = known && !isLast ? known.split(",").length : 1
    const value = isLast
      ? pieces.slice(cursor).join(",")
      : pieces.slice(cursor, cursor + size).join(",")
    cursor += size
    return known || value
  })
}

export const getGroupParts = (chart, id, { omit = [] } = {}) => {
  const parts = { labels: {} }
  if (!id || placeholderIds.has(id)) return parts

  const viewDimensions = chart.getAttribute("viewDimensions")
  const nodes = chart.getAttribute("nodes")
  const grouped = chart.getDimensionGroups()
  const levels = getLevels(grouped)
  const values = splitParts(id, levels, viewDimensions, chart.getDimensionIndex(id))

  levels.forEach((level, index) => {
    const value = values[index]
    if (!value || value === unsetValue || omit.includes(grouped[index])) return

    if (level.kind === "label") {
      parts.labels[level.key] = value
      return
    }

    if (level.kind === "node") {
      const found = findNode(nodes, value)
      parts.node = found ? found.node.nd || found.key : value
      return
    }

    parts[level.kind] = value
  })

  return parts
}

export const triggerGroupClick = (chart, { source, groupId, dimensionIds, omit }) =>
  chart.sdk.trigger("groupClick", chart, {
    source,
    groupId,
    dimensionIds,
    parts: getGroupParts(chart, dimensionIds[0], { omit }),
  })
