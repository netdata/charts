import { getLevels, findNode } from "./tree"

const unsetValue = "[unset]"

const toFilter = (level, value, nodes) => {
  if (level.kind === "label" && value !== unsetValue)
    return {
      kind: "label",
      selector: `${level.key}:${value}`,
      label: `Filter to ${level.key} = ${value}`,
    }

  if (level.kind === "node") {
    const found = findNode(nodes, value)
    if (found)
      return {
        kind: "node",
        selector: found.key,
        label: `Filter to node ${found.node.nm || value}`,
      }
  }

  return null
}

export const getDrillFilters = (boxId, grouped, nodes) => {
  const levels = getLevels(grouped)
  const parts = boxId.split(",")
  if (!levels.length || parts.length !== levels.length) return []

  return parts.map((value, index) => toFilter(levels[index], value, nodes)).filter(Boolean)
}

const asSelected = values => values.map(value => ({ value }))

const labelKey = selector => selector.slice(0, selector.indexOf(":"))

export const applyDrillFilter = (chart, filter) => {
  if (filter.kind === "label") {
    const key = labelKey(filter.selector)
    const current = chart.getAttribute("selectedLabels") || []
    const others = current.filter(selector => labelKey(selector) !== key)
    chart.updateLabelsAttribute(asSelected([...others, filter.selector]))
    return
  }

  if (filter.kind === "node") {
    const instances = (chart.getAttribute("selectedInstances") || []).filter(instance =>
      instance.endsWith(`@${filter.selector}`)
    )
    chart.updateNodesAttribute([
      { value: filter.selector },
      ...instances.map(value => ({ value, isInstance: true })),
    ])
  }
}
