export const getNodeDisplayName = (chart, nodeId, fallback) =>
  chart.getAttribute("nodesById")?.[nodeId]?.name || fallback
