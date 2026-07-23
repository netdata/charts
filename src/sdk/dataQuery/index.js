import { buildDataRequest, withDataRequestAuth } from "./request"
import {
  normalizeDataQueryUnits,
  validateDataQueryResponse,
  validateDataQueryTierCoverage,
} from "./response"
import { DataRequestError, fetchDataRequest } from "./transport"

export * from "./request"
export * from "./response"
export * from "./transport"

const defaultOptions = ["jsonwrap", "flip", "ms", "jw-anomaly-rates", "minify"]
const clientTimeoutGraceMs = 5_000
const directAgentUrlLimitBytes = 96 * 1024

const validateTransportCapability = (request, { agent }) => {
  if (!agent) return

  const urlBytes = new TextEncoder().encode(request.url).byteLength
  if (urlBytes > directAgentUrlLimitBytes)
    throw new DataRequestError("Data request is too large for direct Agent transport", {
      code: "request-too-large",
    })
}

const validateRequestAttributes = (attributes, expectedNodeIds) => {
  const {
    host,
    limit,
    tier,
    timeout,
    after,
    before,
    points,
    groupBy,
    groupByLabel,
    aggregationMethod,
    format,
    options,
    showPostAggregations,
    timeGroupOptions,
    time_group_options: snakeCaseTimeGroupOptions,
    unaligned,
  } = attributes
  if (typeof host !== "string" || !host) throw new TypeError("Data query requires a host")
  if (!Array.isArray(expectedNodeIds) || !expectedNodeIds.length)
    throw new TypeError("Data query requires captured node IDs")
  if (
    expectedNodeIds.some(nodeId => typeof nodeId !== "string" || !nodeId) ||
    new Set(expectedNodeIds).size !== expectedNodeIds.length
  )
    throw new TypeError("Data query requires unique captured node IDs")
  if (!Number.isInteger(limit) || limit <= 0)
    throw new TypeError("Data query limit must be a positive integer")
  if (limit !== expectedNodeIds.length)
    throw new TypeError("Data query limit must match captured node count")
  if (tier != null && (!Number.isInteger(tier) || tier < 0))
    throw new TypeError("Data query tier must be a non-negative integer")
  if (timeout != null && (!Number.isInteger(timeout) || timeout <= 0))
    throw new TypeError("Data query timeout must be a positive integer")
  if (!Number.isFinite(after) || !Number.isFinite(before))
    throw new TypeError("Data query requires a finite time window")
  if (after <= 0 || before <= after)
    throw new TypeError("Data query requires an ordered absolute time window")
  if (points !== 1) throw new TypeError("Data query requires exactly one point")
  if (!Array.isArray(groupBy) || groupBy.length !== 1 || groupBy[0] !== "node")
    throw new TypeError("Data query requires final grouping by node")
  if (!Array.isArray(groupByLabel) || groupByLabel.length)
    throw new TypeError("Data query does not support node label grouping")
  if (showPostAggregations) throw new TypeError("Data query does not support post aggregations")
  if (typeof aggregationMethod !== "string" || !aggregationMethod)
    throw new TypeError("Data query requires a metric aggregation")
  if (typeof getTimeGroup(attributes) !== "string" || !getTimeGroup(attributes))
    throw new TypeError("Data query requires a time aggregation")
  const resolvedTimeGroupOptions = timeGroupOptions ?? snakeCaseTimeGroupOptions
  if (resolvedTimeGroupOptions != null && typeof resolvedTimeGroupOptions !== "string")
    throw new TypeError("Data query time group options must be a string")
  if (format !== "json2") throw new TypeError("Data query requires JSON2 format")
  if (!Array.isArray(options)) throw new TypeError("Data query options must be an array")
  if (!unaligned && !options.includes("unaligned"))
    throw new TypeError("Data query requires unaligned results")
  if (options.includes("nonzero")) throw new TypeError("Data query cannot eliminate zero values")
  if (options.includes("null2zero")) throw new TypeError("Data query cannot convert gaps to zero")
}

const getTimeGroup = attributes => attributes.time_group ?? attributes.groupingMethod

export default ({ getAttributes }) =>
  async (
    attributes = {},
    { expectedNodeIds, rateVolume = false, requireTierCoverage = false, ...options } = {}
  ) => {
    const requestAttributes = {
      ...getAttributes(),
      ...attributes,
      options: attributes.options ?? defaultOptions,
      format: attributes.format || "json2",
    }
    const capturedNodeIds = expectedNodeIds ?? requestAttributes.selectedNodes
    validateRequestAttributes(requestAttributes, capturedNodeIds)
    if (requireTierCoverage && requestAttributes.tier == null)
      throw new TypeError("Data query tier coverage requires an explicit tier")

    const request = buildDataRequest(requestAttributes)
    validateTransportCapability(request, requestAttributes)
    const payload = await fetchDataRequest(
      request,
      withDataRequestAuth(requestAttributes, options),
      {
        ...(requestAttributes.timeout && {
          timeoutMs: requestAttributes.timeout + clientTimeoutGraceMs,
        }),
      }
    )

    if (payload?.errorMessage || payload?.errorMsgKey)
      throw new DataRequestError(payload.errorMessage || payload.errorMsgKey, { payload })

    const validation = validateDataQueryResponse(payload, capturedNodeIds)
    const tierCoverage = requireTierCoverage
      ? validateDataQueryTierCoverage(payload, {
          after: requestAttributes.after,
          before: requestAttributes.before,
          expectedNodeIds: capturedNodeIds,
          tier: requestAttributes.tier,
        })
      : undefined

    return {
      payload,
      ...validation,
      ...(tierCoverage && { tierCoverage }),
      units: normalizeDataQueryUnits(payload, {
        rateVolume,
        timeGroup: getTimeGroup(requestAttributes),
      }),
    }
  }
