import { useCallback, useMemo } from "react"
import { useChart, useAttributeValue } from "@/components/provider"
import { getIdentifyingLabels } from "@/helpers/identifyingLabels"
import { getNodeDisplayName } from "@/helpers/nodeDisplayName"

const hasLabels = entry => !!entry && Object.keys(entry.labels).length > 0

const getIdentities = (instances, instanceLabels) => {
  if (!instanceLabels) return {}

  const rows = Object.keys(instances)
    .filter(key => hasLabels(instanceLabels[key]))
    .map(key => ({ id: key, ...instanceLabels[key] }))

  return getIdentifyingLabels(rows)
}

const getIdentityProps = (chart, nodes, identity, nodeId) => {
  if (!identity?.pairs.length) return {}

  const nodeName = getNodeDisplayName(chart, nodeId, nodes[nodeId]?.nm || nodeId)
  const pairsLabel = identity.pairs.map(([name, value]) => `${name}: ${value}`).join(" ")

  return {
    labelPairs: identity.pairs,
    labelRest: identity.rest,
    ambiguous: identity.ambiguous,
    nodeName,
    identityLabel: `${pairsLabel} @ ${nodeName}`,
  }
}

const useInstanceIdentities = () => {
  const chart = useChart()
  const instances = useAttributeValue("instances")
  const instanceLabels = useAttributeValue("instanceLabels")
  const nodes = useAttributeValue("nodes")
  const nodesById = useAttributeValue("nodesById")

  const identities = useMemo(
    () => getIdentities(instances, instanceLabels),
    [instances, instanceLabels]
  )

  return useCallback(
    key => getIdentityProps(chart, nodes, identities[key], instanceLabels?.[key]?.node),
    [chart, nodes, nodesById, identities, instanceLabels]
  )
}

export default useInstanceIdentities
