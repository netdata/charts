const nodeKeysByNodes = new WeakMap()

const getNodeKeys = nodes => {
  if (!nodes || typeof nodes !== "object") return null

  let keys = nodeKeysByNodes.get(nodes)
  if (keys) return keys

  keys = {}
  Object.keys(nodes).forEach(key => {
    const node = nodes[key]
    if (node?.mg) keys[node.mg] = key
    if (node?.nd) keys[node.nd] = key
  })
  nodeKeysByNodes.set(nodes, keys)

  return keys
}

const resolveNodeKey = (chart, nodeId) => {
  const nodes = chart.getAttribute("nodes")
  if (nodes?.[nodeId]) return nodeId

  return getNodeKeys(nodes)?.[nodeId] ?? nodeId
}

export const getNodeRawName = (chart, nodeId) =>
  chart.getAttribute("nodes")?.[resolveNodeKey(chart, nodeId)]?.nm

export const getNodeDisplayName = (chart, nodeId, fallback) => {
  const nodesById = chart.getAttribute("nodesById")

  return nodesById?.[nodeId]?.name || nodesById?.[resolveNodeKey(chart, nodeId)]?.name || fallback
}
