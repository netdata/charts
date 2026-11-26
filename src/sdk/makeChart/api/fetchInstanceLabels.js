import { buildDataRequest, withDataRequestAuth } from "../../dataQuery/request"
import { fetchDataRequest } from "../../dataQuery/transport"
import { getChartPayload } from "./helpers"

const getRequestAttributes = chart => {
  const { after, before } = getChartPayload(chart)

  return {
    ...chart.getAttributes(),
    after,
    before,
    points: 1,
    format: "json2",
    selectedNodes: chart.getFilteredNodeIds(),
    selectedInstances: [],
    selectedDimensions: [],
    selectedLabels: [],
    groupBy: ["instance"],
    groupByLabel: [],
    showPostAggregations: false,
    options: ["jsonwrap", "minify", "details"],
  }
}

const addNodeInstances = (acc, nodeKey, node = {}) => {
  const nodeId = node.nd || nodeKey
  const contexts = node.contexts || {}

  Object.keys(contexts).forEach(context => {
    const instances = contexts[context]?.instances || {}

    Object.keys(instances).forEach(instanceId => {
      acc[`${instanceId}@${nodeId}`] = {
        context,
        node: nodeId,
        labels: instances[instanceId]?.labels || {},
      }
    })
  })

  return acc
}

export const parseInstanceLabels = response => {
  const nodes = response?.detailed?.nodes || {}

  return Object.keys(nodes).reduce(
    (acc, nodeKey) => addNodeInstances(acc, nodeKey, nodes[nodeKey]),
    {}
  )
}

export default (chart, options = {}) =>
  fetchDataRequest(
    buildDataRequest(getRequestAttributes(chart)),
    withDataRequestAuth(chart.getAttributes(), options)
  ).then(parseInstanceLabels)
