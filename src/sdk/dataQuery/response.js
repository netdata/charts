import { getPointValue } from "../makeChart/getPointValue"

export const dataQueryNodeStatus = Object.freeze({
  unknown: 0,
  fresh: 1,
  gap: 2,
  failure: 3,
  unavailable: 4,
})

export const dataQueryResultStatus = Object.freeze({
  complete: "complete",
  incomplete: "incomplete",
  unsupported: "unsupported",
})

export const dataQueryTierCoverageStatus = Object.freeze({
  exact: "exact",
  partial: "partial",
  unavailable: "unavailable",
})

const addIssue = (issues, code, details = {}) => issues.push({ code, ...details })

const makeExpectedIndex = (expectedNodeIds, issues) => {
  const ordinalById = new Map()

  expectedNodeIds.forEach((id, ordinal) => {
    if (typeof id !== "string" || !id) {
      addIssue(issues, "invalid-expected-node-id", { ordinal })
      return
    }

    if (ordinalById.has(id)) {
      addIssue(issues, "duplicate-expected-node-id", { id })
      return
    }

    ordinalById.set(id, ordinal)
  })

  return ordinalById
}

const getSummaryNodeOrdinals = (node, ordinalById) => {
  const nodeIdOrdinal = ordinalById.get(node?.nd)
  const machineGuidOrdinal = ordinalById.get(node?.mg)

  return {
    ambiguous:
      nodeIdOrdinal !== undefined &&
      machineGuidOrdinal !== undefined &&
      nodeIdOrdinal !== machineGuidOrdinal,
    machineGuidOrdinal,
    nodeIdOrdinal,
    ordinal: nodeIdOrdinal ?? machineGuidOrdinal,
  }
}

const toSummaryInteger = value => {
  if (value == null) return { valid: true, value: 0 }
  if (typeof value !== "number" && typeof value !== "string") return { valid: false, value: 0 }
  if (typeof value === "string" && !value.trim()) return { valid: false, value: 0 }

  const number = Number(value)
  return Number.isInteger(number) && number >= 0
    ? { valid: true, value: number }
    : { valid: false, value: 0 }
}

const getSummaryNodeStatus = node => {
  const fields = [
    ["st.code", toSummaryInteger(node?.st?.code)],
    ["is.fl", toSummaryInteger(node?.is?.fl)],
    ["ds.fl", toSummaryInteger(node?.ds?.fl)],
    ["ds.sl", toSummaryInteger(node?.ds?.sl)],
    ["ds.qr", toSummaryInteger(node?.ds?.qr)],
  ]
  const invalidFields = fields.filter(([, field]) => !field.valid).map(([name]) => name)
  if (invalidFields.length) return { invalidFields, status: dataQueryNodeStatus.unknown }

  const [[, code], [, failedInstances], [, failedDimensions]] = fields

  if (code.value === 401 || code.value === 403)
    return { invalidFields, status: dataQueryNodeStatus.unavailable }
  if ((code.value >= 400 && code.value <= 599) || failedInstances.value || failedDimensions.value)
    return { invalidFields, status: dataQueryNodeStatus.failure }

  return { invalidFields, status: null }
}

const indexSummaryAliases = ({ payload, ordinalById, nodeStatuses, issues }) => {
  const ordinalByAlias = new Map()
  const summaryByOrdinal = new Array(ordinalById.size)
  const summaryNodes = Array.isArray(payload?.summary?.nodes) ? payload.summary.nodes : []

  summaryNodes.forEach(node => {
    const { ambiguous, machineGuidOrdinal, nodeIdOrdinal, ordinal } = getSummaryNodeOrdinals(
      node,
      ordinalById
    )
    if (ambiguous) {
      addIssue(issues, "ambiguous-summary-node", { machineGuid: node?.mg, nodeId: node?.nd })
      nodeStatuses[machineGuidOrdinal] = dataQueryNodeStatus.unknown
      nodeStatuses[nodeIdOrdinal] = dataQueryNodeStatus.unknown
      return
    }
    if (ordinal === undefined) {
      addIssue(issues, "unexpected-summary-node", { machineGuid: node?.mg, nodeId: node?.nd })
      return
    }
    if (summaryByOrdinal[ordinal] !== undefined) {
      addIssue(issues, "duplicate-summary-node", { ordinal })
      nodeStatuses[ordinal] = dataQueryNodeStatus.unknown
      return
    }

    summaryByOrdinal[ordinal] = node

    const aliases = [node?.mg, node?.nd].filter(Boolean)
    aliases.forEach(alias => {
      const previousOrdinal = ordinalByAlias.get(alias)
      if (previousOrdinal !== undefined && previousOrdinal !== ordinal) {
        addIssue(issues, "duplicate-summary-alias", { alias })
        return
      }
      ordinalByAlias.set(alias, ordinal)
    })

    const { invalidFields, status } = getSummaryNodeStatus(node)
    if (invalidFields.length)
      addIssue(issues, "invalid-summary-node-status", { ordinal, fields: invalidFields })
    if (status !== null) nodeStatuses[ordinal] = status
  })

  return { ordinalByAlias, summaryByOrdinal }
}

const resolveResultOrdinal = (label, ordinalById, ordinalByAlias) =>
  ordinalById.get(label) ?? ordinalByAlias.get(label)

const getResultShape = (payload, issues) => {
  const { result } = payload || {}
  if (!result || !Array.isArray(result.labels) || !Array.isArray(result.data)) {
    addIssue(issues, "unsupported-result-shape")
    return null
  }
  if (!result.labels.length) {
    if (result.data.length) addIssue(issues, "unsupported-result-labels")
    return { result, row: null }
  }
  if (result.labels[0] !== "time") {
    addIssue(issues, "unsupported-result-labels")
    return null
  }
  if (result.data.length > 1)
    addIssue(issues, "unexpected-point-count", { points: result.data.length })

  const row = result.data[0]
  if (result.data.length && (!Array.isArray(row) || row.length !== result.labels.length))
    addIssue(issues, "misaligned-result-row", {
      labels: result.labels.length,
      values: Array.isArray(row) ? row.length : null,
    })
  if (Array.isArray(row) && (typeof row[0] !== "number" || !isFinite(row[0])))
    addIssue(issues, "invalid-result-timestamp")

  return { result, row: Array.isArray(row) ? row : null }
}

const getViewNodeIds = (payload, shape, issues) => {
  if (!shape) return null

  const ids = payload?.view?.dimensions?.ids
  if (ids == null) return null
  if (!Array.isArray(ids)) {
    addIssue(issues, "invalid-view-node-identities")
    return null
  }

  const expectedLength = Math.max(0, shape.result.labels.length - 1)
  if (ids.length !== expectedLength)
    addIssue(issues, "misaligned-view-node-identities", {
      identities: ids.length,
      labels: expectedLength,
    })

  const seen = new Set()
  ids.forEach((id, offset) => {
    if (typeof id !== "string" || !id) {
      addIssue(issues, "invalid-view-node-identity", { offset })
      return
    }
    if (seen.has(id)) addIssue(issues, "duplicate-view-node-identity", { id })
    else seen.add(id)
  })

  return ids
}

const resolveIdentityOrdinal = (identity, ordinalById, ordinalByAlias) =>
  typeof identity === "string"
    ? resolveResultOrdinal(identity, ordinalById, ordinalByAlias)
    : undefined

const applyResultValues = ({
  shape,
  ordinalById,
  ordinalByAlias,
  viewNodeIds,
  resultIndexes,
  nodeStatuses,
  issues,
}) => {
  if (!shape) return

  const { result, row } = shape
  const resultOrdinals = new Set()

  result.labels.slice(1).forEach((label, offset) => {
    const resultIndex = offset + 1
    const viewNodeId = viewNodeIds?.[offset]
    if (label === "OTHERS" || viewNodeId === "OTHERS") {
      addIssue(issues, "others-result")
      return
    }

    const labelOrdinal = resolveIdentityOrdinal(label, ordinalById, ordinalByAlias)
    const viewOrdinal = resolveIdentityOrdinal(viewNodeId, ordinalById, ordinalByAlias)
    if (viewNodeIds !== null && viewOrdinal === undefined) {
      addIssue(issues, "unexpected-result-node", { label, viewNodeId })
      return
    }
    if (labelOrdinal !== undefined && viewOrdinal !== undefined && labelOrdinal !== viewOrdinal) {
      addIssue(issues, "conflicting-result-node-identities", { label, viewNodeId })
      return
    }

    const ordinal = viewNodeIds === null ? labelOrdinal : viewOrdinal
    if (ordinal === undefined) {
      addIssue(issues, "unexpected-result-node", { label, viewNodeId })
      return
    }
    if (resultOrdinals.has(ordinal)) {
      addIssue(issues, "duplicate-result-node", { label })
      return
    }

    resultOrdinals.add(ordinal)
    resultIndexes[ordinal] = resultIndex
    if (!row) return

    const value = getPointValue(row[resultIndex], result.point)
    if (value === null) {
      // Keep a more specific summary or identity status; nodes start as gaps.
    } else if (typeof value === "number" && isFinite(value)) {
      const currentStatus = nodeStatuses[ordinal]
      if (
        currentStatus === dataQueryNodeStatus.failure ||
        currentStatus === dataQueryNodeStatus.unavailable
      )
        addIssue(issues, "value-for-failed-node", { label })
      else if (currentStatus !== dataQueryNodeStatus.unknown)
        nodeStatuses[ordinal] = dataQueryNodeStatus.fresh
    } else {
      if (nodeStatuses[ordinal] === dataQueryNodeStatus.gap)
        nodeStatuses[ordinal] = dataQueryNodeStatus.unavailable
      addIssue(issues, "invalid-result-value", { label })
    }
  })
}

const getMissingNodeIds = ({ nodeIds, resultIndexes, nodeStatuses, summaryByOrdinal, issues }) => {
  const missingNodeIds = []
  const missingSelectedNodeIds = []

  nodeIds.forEach((nodeId, ordinal) => {
    if (resultIndexes[ordinal] !== -1) return
    missingNodeIds.push(nodeId)

    const status = nodeStatuses[ordinal]
    if (
      status === dataQueryNodeStatus.failure ||
      status === dataQueryNodeStatus.unavailable ||
      status === dataQueryNodeStatus.unknown
    )
      return

    const summary = summaryByOrdinal[ordinal]
    if (toSummaryInteger(summary?.ds?.sl).value > 0 || toSummaryInteger(summary?.ds?.qr).value > 0)
      missingSelectedNodeIds.push(nodeId)
  })

  if (missingSelectedNodeIds.length)
    addIssue(issues, "missing-selected-result-nodes", {
      count: missingSelectedNodeIds.length,
    })

  return { missingNodeIds, missingSelectedNodeIds }
}

const getResultStatus = issues => {
  if (issues.some(({ code }) => code.startsWith("unsupported-")))
    return dataQueryResultStatus.unsupported
  if (issues.length) return dataQueryResultStatus.incomplete

  return dataQueryResultStatus.complete
}

export const validateDataQueryResponse = (payload, expectedNodeIds = []) => {
  const issues = []
  const nodeIds = Array.isArray(expectedNodeIds) ? [...expectedNodeIds] : []
  if (!Array.isArray(expectedNodeIds)) addIssue(issues, "unsupported-expected-node-ids")

  const ordinalById = makeExpectedIndex(nodeIds, issues)
  const resultIndexes = new Int32Array(nodeIds.length)
  resultIndexes.fill(-1)
  const nodeStatuses = new Uint8Array(nodeIds.length)
  nodeStatuses.fill(dataQueryNodeStatus.gap)
  const { ordinalByAlias, summaryByOrdinal } = indexSummaryAliases({
    payload,
    ordinalById,
    nodeStatuses,
    issues,
  })
  const shape = getResultShape(payload, issues)
  const viewNodeIds = getViewNodeIds(payload, shape, issues)

  applyResultValues({
    shape,
    ordinalById,
    ordinalByAlias,
    viewNodeIds,
    resultIndexes,
    nodeStatuses,
    issues,
  })

  const { missingNodeIds, missingSelectedNodeIds } = getMissingNodeIds({
    nodeIds,
    resultIndexes,
    nodeStatuses,
    summaryByOrdinal,
    issues,
  })
  const status = getResultStatus(issues)

  return {
    status,
    complete: status === dataQueryResultStatus.complete,
    nodeIds,
    resultIndexes,
    nodeStatuses,
    missingNodeIds,
    missingSelectedNodeIds,
    issues,
  }
}

const getTierValue = (value, snakeCase, camelCase = snakeCase) => {
  const raw = value?.[snakeCase] ?? value?.[camelCase]
  return raw == null ? Number.NaN : Number(raw)
}

const makeTierCoverage = (status, reason) => ({
  exact: status === dataQueryTierCoverageStatus.exact,
  reason,
  status,
})

export const validateDataQueryTierCoverage = (
  payload,
  { after, before, expectedNodeIds = [], tier = 0 } = {}
) => {
  if (
    !Number.isFinite(after) ||
    !Number.isFinite(before) ||
    before <= after ||
    !Number.isInteger(tier) ||
    tier < 0
  )
    return makeTierCoverage(dataQueryTierCoverageStatus.unavailable, "invalid-tier-window")

  if (!Array.isArray(expectedNodeIds) || expectedNodeIds.length !== 1)
    return makeTierCoverage(
      dataQueryTierCoverageStatus.unavailable,
      "per-node-tier-coverage-unavailable"
    )

  const aggregated = payload?.view?.dimensions?.aggregated
  if (!Array.isArray(aggregated) || aggregated.length !== 1 || aggregated[0] !== 1)
    return makeTierCoverage(
      dataQueryTierCoverageStatus.unavailable,
      "source-metric-tier-coverage-unavailable"
    )

  const perTier = payload?.db?.per_tier ?? payload?.db?.perTier
  if (!Array.isArray(perTier))
    return makeTierCoverage(dataQueryTierCoverageStatus.unavailable, "missing-tier-metadata")

  const selected = perTier.filter(value => getTierValue(value, "tier") === tier)
  if (selected.length !== 1)
    return makeTierCoverage(dataQueryTierCoverageStatus.unavailable, "missing-tier-metadata")

  if (
    perTier.some(value => getTierValue(value, "tier") !== tier && getTierValue(value, "points") > 0)
  )
    return makeTierCoverage(dataQueryTierCoverageStatus.partial, "unexpected-tier-data")

  const metadata = selected[0]
  const queries = getTierValue(metadata, "queries")
  const updateEvery = getTierValue(metadata, "update_every", "updateEvery")
  const firstEntry = getTierValue(metadata, "first_entry", "firstEntry")
  const lastEntry = getTierValue(metadata, "last_entry", "lastEntry")
  if (
    queries !== 1 ||
    !Number.isFinite(updateEvery) ||
    updateEvery <= 0 ||
    !Number.isFinite(firstEntry) ||
    firstEntry <= 0 ||
    !Number.isFinite(lastEntry) ||
    lastEntry <= 0
  )
    return makeTierCoverage(dataQueryTierCoverageStatus.unavailable, "invalid-tier-metadata")

  if (firstEntry > after + updateEvery)
    return makeTierCoverage(dataQueryTierCoverageStatus.partial, "tier-retention-start")
  if (lastEntry < before - updateEvery)
    return makeTierCoverage(dataQueryTierCoverageStatus.partial, "tier-retention-end")

  return makeTierCoverage(dataQueryTierCoverageStatus.exact)
}

const getSourceUnits = payload => {
  const dimensionUnits = payload?.view?.dimensions?.units
  if (Array.isArray(dimensionUnits) && dimensionUnits.length) return [...dimensionUnits]

  const units = payload?.view?.units
  if (Array.isArray(units)) return [...units]
  if (typeof units === "string") return [units]

  return []
}

export const normalizeDataQueryUnits = (payload, { rateVolume = false, timeGroup } = {}) => {
  const sourceUnits = getSourceUnits(payload)
  if (!rateVolume)
    return { available: true, status: "source", sourceUnits, units: [...sourceUnits] }

  if (timeGroup !== "sum")
    return { available: false, status: "unavailable", sourceUnits, units: [] }

  if (!sourceUnits.length || sourceUnits.some(unit => typeof unit !== "string" || !unit))
    return { available: false, status: "unavailable", sourceUnits, units: [] }

  const rateUnits = sourceUnits.filter(unit => unit.endsWith("/s"))
  if (rateUnits.length === sourceUnits.length) {
    const units = sourceUnits.map(unit => unit.slice(0, -2))
    if (units.some(unit => !unit))
      return { available: false, status: "unavailable", sourceUnits, units: [] }

    return { available: true, status: "normalized", sourceUnits, units }
  }

  if (!rateUnits.length)
    return { available: true, status: "source", sourceUnits, units: [...sourceUnits] }

  return { available: false, status: "unavailable", sourceUnits, units: [] }
}
