import React from "react"
import { Dot } from "@/components/modern/dot"

export const statusColors = { critical: "error", warning: "warning", clear: "success" }

const statusLabels = {
  critical: "Critical alerts raised",
  warning: "Warning alerts raised",
  clear: "Alerts clear",
}

const makeIndex = (nodes = {}, instances = {}) => {
  const nodesByKey = {}
  const nodesByIndex = {}

  Object.keys(nodes).forEach(key => {
    const node = nodes[key]
    nodesByKey[key] = node
    if (node?.mg) nodesByKey[node.mg] = node
    if (node?.nd) nodesByKey[node.nd] = node
    if (node && node.ni !== undefined) nodesByIndex[node.ni] = node
  })

  const instancesByKey = {}

  Object.keys(instances).forEach(key => {
    const instance = instances[key]
    instancesByKey[key] = instance
    const node = nodesByIndex[instance?.ni]
    if (!instance?.id || !node) return
    if (node.mg) instancesByKey[`${instance.id}@${node.mg}`] = instance
    if (node.nd) instancesByKey[`${instance.id}@${node.nd}`] = instance
  })

  return { nodesByKey, instancesByKey }
}

const cache = new WeakMap()

const getIndex = chart => {
  const nodes = chart.getAttribute("nodes")
  const instances = chart.getAttribute("instances")
  const cached = cache.get(chart)

  if (cached && cached.nodes === nodes && cached.instances === instances) return cached.index

  const index = makeIndex(nodes, instances)
  cache.set(chart, { nodes, instances, index })
  return index
}

export const getRowStatus = (chart, ids = []) => {
  const groups = chart.getDimensionGroups()
  const nodeIndex = groups.indexOf("node")
  const instanceIndex = groups.indexOf("instance")

  if (nodeIndex === -1 && instanceIndex === -1) return null

  const { nodesByKey, instancesByKey } = getIndex(chart)
  const seen = new Set()
  let critical = 0
  let warning = 0
  let clear = 0
  let found = false

  ids.forEach(id => {
    if (typeof id !== "string" || id === "OTHERS") return

    const parts = id.split(",")
    const target =
      (instanceIndex !== -1 && instancesByKey[parts[instanceIndex]]) ||
      (nodeIndex !== -1 && nodesByKey[parts[nodeIndex]])

    if (!target?.al || seen.has(target)) return

    seen.add(target)
    found = true
    critical += target.al.cr || 0
    warning += target.al.wr || 0
    clear += target.al.cl || 0
  })

  if (!found) return null
  if (critical) return "critical"
  if (warning) return "warning"
  if (clear) return "clear"
  return null
}

export const StatusDot = ({ status }) =>
  status ? (
    <Dot
      background={statusColors[status]}
      data-testid="modernTable-status"
      data-status={status}
      role="img"
      aria-label={statusLabels[status]}
      title={statusLabels[status]}
    />
  ) : null
