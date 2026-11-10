export const getNodeDisplayName = (chart, nodeId, fallback) =>
  chart.getAttribute("nodesById")?.[nodeId]?.name || fallback

export const getSearchableNodeName = (chart, nodeId, hostname) => {
  const alias = getNodeDisplayName(chart, nodeId)

  return alias && hostname && alias !== hostname ? `${alias} (${hostname})` : hostname
}
