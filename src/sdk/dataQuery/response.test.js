import {
  dataQueryNodeStatus,
  dataQueryTierCoverageStatus,
  normalizeDataQueryUnits,
  validateDataQueryResponse,
  validateDataQueryTierCoverage,
} from "./response"

const makePayload = ({
  labels,
  values,
  nodes,
  data,
  point = { value: 0 },
  units,
  ids,
  names,
  groupedBy,
} = {}) => ({
  summary: { nodes: nodes || [] },
  view: {
    dimensions: {
      units: units || [],
      ...(ids && { ids }),
      ...(names && { names }),
      ...(groupedBy && { grouped_by: groupedBy }),
    },
  },
  result: {
    labels: labels || ["time"],
    data: data || (values ? [[1000, ...values]] : []),
    point,
  },
})

describe("data query response validation", () => {
  it("maps machine GUID labels, preserves zero and negatives, and records absent nodes as gaps", () => {
    const payload = makePayload({
      labels: ["time", "machine-1", "machine-2"],
      values: [0, -2],
      nodes: [
        { mg: "machine-1", nd: "node-1", st: { code: 200 }, ds: { qr: 1 } },
        { mg: "machine-2", nd: "node-2", st: { code: 200 }, ds: { qr: 1 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2", "node-3"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.resultIndexes)).toEqual([1, 2, -1])
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.gap,
    ])
    expect(result.missingNodeIds).toEqual(["node-3"])
    expect(result.issues).toEqual([])
  })

  it("uses ordinal-aligned view IDs for released name-labelled responses", () => {
    const payload = makePayload({
      labels: ["time", "duplicate-name", "duplicate-name"],
      ids: ["machine-1", "machine-2"],
      names: ["duplicate-name", "duplicate-name"],
      groupedBy: ["node"],
      values: [0, -2],
      nodes: [
        { mg: "machine-1", nd: "node-1", nm: "duplicate-name", ds: { sl: 1, qr: 1 } },
        { mg: "machine-2", nd: "node-2", nm: "duplicate-name", ds: { sl: 1, qr: 1 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2", "node-3"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.resultIndexes)).toEqual([1, 2, -1])
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.gap,
    ])
    expect(result.missingNodeIds).toEqual(["node-3"])
    expect(result.issues).toEqual([])
  })

  it("rejects conflicting direct and ordinal-aligned node identities", () => {
    const payload = makePayload({
      labels: ["time", "node-1"],
      ids: ["machine-2"],
      values: [5],
      nodes: [
        { mg: "machine-1", nd: "node-1" },
        { mg: "machine-2", nd: "node-2" },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "conflicting-result-node-identities" })
    )
  })

  it("rejects an unresolved canonical view identity instead of falling back to its label", () => {
    const payload = makePayload({
      labels: ["time", "node-1"],
      ids: ["unexpected-node"],
      values: [5],
    })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.resultIndexes)).toEqual([-1])
    expect(result.issues).toContainEqual(
      expect.objectContaining({
        code: "unexpected-result-node",
        label: "node-1",
        viewNodeId: "unexpected-node",
      })
    )
  })

  it("rejects malformed or misaligned view identity metadata", () => {
    const invalid = makePayload({
      labels: ["time", "node-1"],
      ids: ["node-1", "node-2"],
      values: [5],
    })
    const duplicate = makePayload({
      labels: ["time", "name-1", "name-2"],
      ids: ["node-1", "node-1"],
      values: [5, 6],
    })

    expect(validateDataQueryResponse(invalid, ["node-1"]).issues).toContainEqual(
      expect.objectContaining({ code: "misaligned-view-node-identities" })
    )
    expect(validateDataQueryResponse(duplicate, ["node-1", "node-2"]).issues).toContainEqual(
      expect.objectContaining({ code: "duplicate-view-node-identity" })
    )
  })

  it("keeps a selected and successfully queried node with no result incomplete", () => {
    const payload = makePayload({
      labels: ["time", "machine-1"],
      ids: ["machine-1"],
      values: [5],
      nodes: [
        { mg: "machine-1", nd: "node-1", ds: { sl: 1, qr: 1 } },
        { mg: "machine-2", nd: "node-2", ds: { sl: 1, qr: 1 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.status).toBe("incomplete")
    expect(result.missingSelectedNodeIds).toEqual(["node-2"])
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "missing-selected-result-nodes", count: 1 })
    )
  })

  it("accepts the released empty JSON2 result as complete gaps", () => {
    const payload = makePayload({ labels: [], data: [], ids: [] })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.gap,
      dataQueryNodeStatus.gap,
    ])
    expect(result.missingNodeIds).toEqual(["node-1", "node-2"])
  })

  it("reads compact JSON2 values without expanding the response", () => {
    const payload = makePayload({
      labels: ["time", "node-1", "node-2"],
      values: [[5, 20], null],
      point: { value: 0, arp: 1 },
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.gap,
    ])
    expect(result.payload).toBeUndefined()
  })

  it("publishes query failures and authorization failures alongside absent-node gaps", () => {
    const payload = makePayload({
      labels: ["time", "machine-1", "machine-2"],
      values: [null, null],
      nodes: [
        { mg: "machine-1", nd: "node-1", st: { code: "504" }, ds: { fl: "1", qr: "0" } },
        { mg: "machine-2", nd: "node-2", st: { code: "403" } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2", "node-3"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.failure,
      dataQueryNodeStatus.unavailable,
      dataQueryNodeStatus.gap,
    ])
    expect(result.missingNodeIds).toEqual(["node-3"])
    expect(result.issues).toEqual([])
  })

  it("rejects malformed summary status fields instead of classifying them as gaps", () => {
    const payload = makePayload({
      nodes: [
        { mg: "machine-1", nd: "node-1", st: { code: {} } },
        { mg: "machine-2", nd: "node-2", ds: { fl: "not-a-number" } },
        { mg: "machine-3", nd: "node-3", ds: { sl: -1 } },
        { mg: "machine-4", nd: "node-4", ds: { qr: 1.5 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2", "node-3", "node-4"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.unknown,
      dataQueryNodeStatus.unknown,
      dataQueryNodeStatus.unknown,
      dataQueryNodeStatus.unknown,
    ])
    expect(result.issues).toEqual([
      { code: "invalid-summary-node-status", ordinal: 0, fields: ["st.code"] },
      { code: "invalid-summary-node-status", ordinal: 1, fields: ["ds.fl"] },
      { code: "invalid-summary-node-status", ordinal: 2, fields: ["ds.sl"] },
      { code: "invalid-summary-node-status", ordinal: 3, fields: ["ds.qr"] },
    ])
  })

  it("accepts a missing result when the summary provides an explicit node failure", () => {
    const payload = makePayload({
      labels: ["time", "machine-1"],
      ids: ["machine-1"],
      values: [5],
      nodes: [
        { mg: "machine-1", nd: "node-1", st: { code: 200 }, ds: { sl: 1, qr: 1 } },
        { mg: "machine-2", nd: "node-2", st: { code: 504 }, ds: { sl: 1, fl: 1 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.fresh,
      dataQueryNodeStatus.failure,
    ])
    expect(result.missingNodeIds).toEqual(["node-2"])
    expect(result.issues).toEqual([])
  })

  it("keeps backend failure states authoritative when inconsistent values are present", () => {
    const payload = makePayload({
      labels: ["time", "machine-1", "machine-2", "machine-3"],
      values: [1, 2, 3],
      nodes: [
        { mg: "machine-1", nd: "node-1", st: { code: 504 } },
        { mg: "machine-2", nd: "node-2", st: { code: 200 }, is: { fl: "1" } },
        { mg: "machine-3", nd: "node-3", st: { code: 200 }, ds: { fl: "1", qr: "1" } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2", "node-3"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.failure,
      dataQueryNodeStatus.failure,
      dataQueryNodeStatus.failure,
    ])
    expect(result.issues.filter(({ code }) => code === "value-for-failed-node")).toHaveLength(3)
  })

  it("keeps ambiguous summary identities unknown and marks the result incomplete", () => {
    const payload = makePayload({
      nodes: [{ mg: "node-1", nd: "node-2", st: { code: 403 } }],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.unknown,
      dataQueryNodeStatus.unknown,
    ])
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "ambiguous-summary-node" })
    )
  })

  it("does not let result values erase ambiguous identity states", () => {
    const payload = makePayload({
      labels: ["time", "node-1", "node-2"],
      values: [1, 2],
      nodes: [{ mg: "node-1", nd: "node-2", st: { code: 200 } }],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.unknown,
      dataQueryNodeStatus.unknown,
    ])
  })

  it("treats explicit empty data for all identified nodes as complete gaps", () => {
    const payload = makePayload({ labels: ["time", "node-1", "node-2"], data: [] })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([
      dataQueryNodeStatus.gap,
      dataQueryNodeStatus.gap,
    ])
    expect(result.missingNodeIds).toEqual([])
  })

  it("marks summary identities outside the captured node set incomplete", () => {
    const payload = makePayload({
      labels: ["time", "node-1"],
      values: [1],
      nodes: [{ mg: "unexpected-machine", nd: "unexpected-node", st: { code: 504 } }],
    })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([dataQueryNodeStatus.fresh])
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "unexpected-summary-node" })
    )
  })

  it.each([
    ["OTHERS", "others-result"],
    ["unexpected-node", "unexpected-result-node"],
  ])("marks %s labels incomplete", (label, issue) => {
    const payload = makePayload({ labels: ["time", label], values: [1] })
    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(expect.objectContaining({ code: issue }))
  })

  it("rejects OTHERS when only the canonical view identity exposes it", () => {
    const payload = makePayload({ labels: ["time", "Remaining"], ids: ["OTHERS"], values: [1] })
    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "others-result" }))
  })

  it("marks aliases for the same captured node incomplete", () => {
    const payload = makePayload({
      labels: ["time", "machine-1", "node-1"],
      values: [1, 2],
      nodes: [{ mg: "machine-1", nd: "node-1", st: { code: 200 } }],
    })
    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "duplicate-result-node" }))
  })

  it("accepts one summary node with machine and node aliases", () => {
    const payload = makePayload({
      labels: ["time", "machine-1"],
      values: [5],
      nodes: [{ mg: "machine-1", nd: "node-1", st: { code: 200 } }],
    })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.complete).toBe(true)
    expect(Array.from(result.nodeStatuses)).toEqual([dataQueryNodeStatus.fresh])
    expect(result.issues).toEqual([])
  })

  it("marks duplicate summary entries for one captured node incomplete", () => {
    const summaryNode = { mg: "machine-1", nd: "node-1", st: { code: 200 } }
    const payload = makePayload({
      labels: ["time", "machine-1"],
      values: [5],
      nodes: [summaryNode, { ...summaryNode }],
    })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([dataQueryNodeStatus.unknown])
    expect(result.issues).toContainEqual({ code: "duplicate-summary-node", ordinal: 0 })
  })

  it("marks duplicate summary aliases incomplete", () => {
    const payload = makePayload({
      labels: ["time", "node-1", "node-2"],
      values: [1, 2],
      nodes: [
        { mg: "shared-machine", nd: "node-1", st: { code: 200 } },
        { mg: "shared-machine", nd: "node-2", st: { code: 200 } },
      ],
    })

    const result = validateDataQueryResponse(payload, ["node-1", "node-2"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "duplicate-summary-alias", alias: "shared-machine" })
    )
  })

  it("marks non-numeric result values unavailable and incomplete", () => {
    const payload = makePayload({ labels: ["time", "node-1"], values: ["invalid"] })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(Array.from(result.nodeStatuses)).toEqual([dataQueryNodeStatus.unavailable])
    expect(result.issues).toContainEqual(expect.objectContaining({ code: "invalid-result-value" }))
  })

  it("rejects multi-point and structurally unsupported responses", () => {
    const multiPoint = makePayload({
      labels: ["time", "node-1"],
      data: [
        [1000, 1],
        [2000, 2],
      ],
    })
    expect(validateDataQueryResponse(multiPoint, ["node-1"]).status).toBe("incomplete")
    expect(
      validateDataQueryResponse(makePayload({ labels: ["time", "node-1"], data: [null] }), [
        "node-1",
      ]).status
    ).toBe("incomplete")
    expect(validateDataQueryResponse({}, ["node-1"]).status).toBe("unsupported")
  })

  it("marks a result with an invalid timestamp incomplete", () => {
    const payload = makePayload({ labels: ["time", "node-1"], data: [[null, 1]] })

    const result = validateDataQueryResponse(payload, ["node-1"])

    expect(result.status).toBe("incomplete")
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "invalid-result-timestamp" })
    )
  })

  it("validates 50,000 name-labelled members through compact ordinal identity arrays", () => {
    const count = 50_000
    const nodeIds = Array.from({ length: count }, (_, ordinal) => `node-${ordinal}`)
    const payload = makePayload({
      labels: ["time", ...Array(count).fill("duplicate-name")],
      ids: nodeIds,
      values: Array.from({ length: count }, (_, ordinal) => ordinal),
    })

    const result = validateDataQueryResponse(payload, nodeIds)

    expect(result.complete).toBe(true)
    expect(result.nodeStatuses).toBeInstanceOf(Uint8Array)
    expect(result.resultIndexes).toBeInstanceOf(Int32Array)
    expect(result.nodeStatuses).toHaveLength(count)
    expect(result.resultIndexes[count - 1]).toBe(count)
    expect(result.missingNodeIds).toHaveLength(0)
  })
})

describe("data query tier coverage validation", () => {
  const makeTierPayload = ({ aggregated = [1], perTier } = {}) => ({
    ...makePayload({ labels: ["time", "node-1"], values: [5] }),
    db: {
      per_tier: perTier || [
        {
          tier: 0,
          queries: 1,
          points: 301,
          update_every: 1,
          first_entry: 900,
          last_entry: 2000,
        },
        {
          tier: 1,
          queries: 0,
          points: 0,
          update_every: 60,
          first_entry: 100,
          last_entry: 1980,
        },
      ],
    },
    view: { dimensions: { aggregated, units: ["percentage"] } },
  })
  const options = { after: 1000, before: 2000, expectedNodeIds: ["node-1"], tier: 0 }

  it("accepts one source metric with complete selected-tier retention", () => {
    expect(validateDataQueryTierCoverage(makeTierPayload(), options)).toEqual({
      exact: true,
      reason: undefined,
      status: dataQueryTierCoverageStatus.exact,
    })
  })

  it.each([
    ["start", { first_entry: 1002, last_entry: 2000 }, "tier-retention-start"],
    ["end", { first_entry: 900, last_entry: 1998 }, "tier-retention-end"],
  ])("reports partial %s retention", (_boundary, tierOverrides, reason) => {
    const payload = makeTierPayload()
    payload.db.per_tier[0] = { ...payload.db.per_tier[0], ...tierOverrides }

    expect(validateDataQueryTierCoverage(payload, options)).toMatchObject({
      exact: false,
      reason,
      status: dataQueryTierCoverageStatus.partial,
    })
  })

  it("rejects lower-tier points instead of treating them as exact", () => {
    const payload = makeTierPayload()
    payload.db.per_tier[1].points = 1

    expect(validateDataQueryTierCoverage(payload, options)).toMatchObject({
      exact: false,
      reason: "unexpected-tier-data",
      status: dataQueryTierCoverageStatus.partial,
    })
  })

  it.each([
    ["multiple nodes", makeTierPayload(), { ...options, expectedNodeIds: ["node-1", "node-2"] }],
    ["multiple source metrics", makeTierPayload({ aggregated: [2] }), options],
    ["string source metric count", makeTierPayload({ aggregated: ["1"] }), options],
    ["boolean source metric count", makeTierPayload({ aggregated: [true] }), options],
    ["missing metadata", { ...makeTierPayload(), db: {} }, options],
  ])("keeps %s explicitly unavailable", (_name, payload, validationOptions) => {
    expect(validateDataQueryTierCoverage(payload, validationOptions)).toMatchObject({
      exact: false,
      status: dataQueryTierCoverageStatus.unavailable,
    })
  })

  it("does not interpret null tier metadata as tier zero", () => {
    const payload = makeTierPayload()
    payload.db.per_tier[0].tier = null

    expect(validateDataQueryTierCoverage(payload, options)).toMatchObject({
      exact: false,
      reason: "missing-tier-metadata",
      status: dataQueryTierCoverageStatus.unavailable,
    })
  })

  it("requires one query and a valid ordered window", () => {
    const payload = makeTierPayload()
    payload.db.per_tier[0].queries = 2
    expect(validateDataQueryTierCoverage(payload, options).reason).toBe("invalid-tier-metadata")
    expect(
      validateDataQueryTierCoverage(makeTierPayload(), { ...options, after: 2000 }).reason
    ).toBe("invalid-tier-window")
  })
})

describe("rate Volume unit normalization", () => {
  it("normalizes only consistently canonical terminal rate units for sum", () => {
    const payload = makePayload({ units: ["MiB/s", "events/s"] })

    expect(normalizeDataQueryUnits(payload, { rateVolume: true, timeGroup: "sum" })).toEqual({
      available: true,
      status: "normalized",
      sourceUnits: ["MiB/s", "events/s"],
      units: ["MiB", "events"],
    })
  })

  it("keeps corrected non-rate units and rejects mixed or unknown units", () => {
    const corrected = makePayload({ units: ["MiB", "events"] })
    expect(normalizeDataQueryUnits(corrected, { rateVolume: true, timeGroup: "sum" }).status).toBe(
      "source"
    )

    const mixed = makePayload({ units: ["MiB/s", "events"] })
    expect(normalizeDataQueryUnits(mixed, { rateVolume: true, timeGroup: "sum" }).available).toBe(
      false
    )

    const unknown = makePayload({ units: [] })
    expect(normalizeDataQueryUnits(unknown, { rateVolume: true, timeGroup: "sum" }).available).toBe(
      false
    )
  })

  it("does not expose rate Volume for a different time calculation", () => {
    const payload = makePayload({ units: ["MiB/s"] })
    expect(
      normalizeDataQueryUnits(payload, { rateVolume: true, timeGroup: "average" }).available
    ).toBe(false)
  })
})
