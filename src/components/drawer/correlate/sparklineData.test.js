import makeDefaultSDK from "@/makeDefaultSDK"
import {
  getSparklineBatchAttributes,
  getSparklineBatchDimensions,
  getSparklineDataFetcher,
  normalizeSparklinePayload,
  sparklineRequestLimits,
} from "./sparklineData"

const makePayload = (dimensions, { units } = {}) => ({
  view: {
    units: "requests/s",
    dimensions: {
      units: units || dimensions.map(() => "requests/s"),
    },
  },
  result: {
    labels: ["time", ...dimensions],
    point: { value: 0, anomalyRate: 1 },
    data: [
      [1000, ...dimensions.map((dimension, index) => [index + 1, 0])],
      [1005, ...dimensions.map((dimension, index) => [index + 2, 0])],
    ],
  },
})

const makeOwner = getChart => {
  const sdk = makeDefaultSDK()
  const owner = sdk.makeChart({
    getChart,
    attributes: {
      after: 100,
      agent: "agent",
      before: 200,
      context: "main-context",
      contextScope: ["main-context"],
      groupingMethod: "average",
      groupingTime: 5,
      host: "host",
      points: 300,
      selectedNodes: ["selected-node"],
    },
  })
  sdk.appendChild(owner)

  return { sdk, owner }
}

const makeDimension = (index, overrides = {}) => ({
  rowId: JSON.stringify(["dimension", index]),
  context: "context",
  dimension: `dimension-${String(index).padStart(3, "0")}`,
  nodeId: "node",
  ...overrides,
})

const makeAttrs = (owner, index) => getSparklineBatchAttributes(owner, [makeDimension(index)])

describe("sparkline batch requests", () => {
  it("builds deterministic bounded batches for one context and node", () => {
    const dimensions = Array.from({ length: 120 }, (_, index) => makeDimension(index)).reverse()
    dimensions.push(makeDimension(200, { context: "other-context" }))
    dimensions.push(makeDimension(201, { nodeId: "other-node" }))

    const batch = getSparklineBatchDimensions(dimensions[44], dimensions)

    expect(batch).toHaveLength(sparklineRequestLimits.batchDimensions)
    expect(batch[0].dimension).toBe("dimension-119")
    expect(batch.at(-1).dimension).toBe("dimension-070")
    expect(batch.every(item => item.context === "context" && item.nodeId === "node")).toBe(true)
    expect(getSparklineBatchDimensions(dimensions[43], dimensions)).toBe(batch)
  })

  it("scopes one request to the batch dimensions and caps its points", () => {
    const { owner } = makeOwner(async () => makePayload([]))
    const dimensions = [makeDimension(2), makeDimension(1), makeDimension(1)]

    expect(getSparklineBatchAttributes(owner, dimensions)).toMatchObject({
      after: 100,
      before: 200,
      context: null,
      contextScope: ["context"],
      eliminateZeroDimensions: false,
      groupBy: ["dimension"],
      nodesScope: ["node"],
      points: sparklineRequestLimits.points,
      postGroupBy: [],
      postGroupByLabel: [],
      selectedContexts: [],
      selectedDimensions: ["dimension-001", "dimension-002"],
      selectedInstances: [],
      selectedLabels: [],
      selectedNodes: [],
      showPostAggregations: false,
    })
  })
})

describe("normalizeSparklinePayload", () => {
  it("extracts compact series directly from JSON2 cells", () => {
    const payload = {
      view: { dimensions: { units: ["microseconds", "bytes"] } },
      result: {
        labels: ["time", "latency", "traffic"],
        point: { value: 0, anomalyRate: 1 },
        data: [
          [1000, [1, 0], [null, 0]],
          [1005, [3, 0], [8, 0]],
        ],
      },
    }

    const result = normalizeSparklinePayload(payload)

    expect(result.get("latency")).toEqual({
      values: [1, 3],
      min: 1,
      max: 3,
      latest: 3,
      unit: "us",
    })
    expect(result.get("traffic")).toEqual({
      values: [null, 8],
      min: 8,
      max: 8,
      latest: 8,
      unit: "By",
    })
  })

  it("rejects responses without chart labels and data", () => {
    expect(() => normalizeSparklinePayload({})).toThrow("Invalid sparkline response")
  })
})

describe("getSparklineDataFetcher", () => {
  it("deduplicates in-flight requests and reuses normalized cached responses", async () => {
    let calls = 0
    const { owner } = makeOwner(async requestChart => {
      calls++
      return makePayload(requestChart.getAttribute("selectedDimensions"))
    })
    const getData = getSparklineDataFetcher(owner)
    const attrs = makeAttrs(owner, 1)

    const [first, second] = await Promise.all([getData(attrs), getData(attrs)])
    const cached = await getData(attrs)

    expect(first).toBe(second)
    expect(cached).toBe(first)
    expect(cached.get("dimension-001").latest).toBe(2)
    expect(calls).toBe(1)
  })

  it("uses a lightweight request facade without adding SDK child charts", async () => {
    let received
    const { sdk, owner } = makeOwner(async (requestChart, options) => {
      received = {
        attrs: options.attrs,
        filteredNodes: requestChart.getFilteredNodeIds(),
        selectedNodes: requestChart.getAttribute("selectedNodes"),
      }
      return makePayload(requestChart.getAttribute("selectedDimensions"))
    })
    const getData = getSparklineDataFetcher(owner)
    const attrs = makeAttrs(owner, 1)

    await getData(attrs)

    expect(received).toMatchObject({
      attrs,
      filteredNodes: [],
      selectedNodes: [],
    })
    expect(sdk.getRoot().getChildren()).toEqual([owner])
    expect(owner.getAttribute("selectedNodes")).toEqual(["selected-node"])
    expect(owner.getAttribute("context")).toBe("main-context")
  })

  it("limits concurrent transport requests", async () => {
    let active = 0
    let maxActive = 0
    const { owner } = makeOwner(async requestChart => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise(resolve => setTimeout(resolve, 5))
      active--
      return makePayload(requestChart.getAttribute("selectedDimensions"))
    })
    const getData = getSparklineDataFetcher(owner)
    const requests = Array.from({ length: 20 }, (_, index) => getData(makeAttrs(owner, index)))

    await Promise.all(requests)

    expect(maxActive).toBe(sparklineRequestLimits.concurrency)
  })

  it("drops queued requests when their consumer aborts", async () => {
    let calls = 0
    const resolvers = []
    const { owner } = makeOwner(
      requestChart =>
        new Promise(resolve => {
          calls++
          resolvers.push(() =>
            resolve(makePayload(requestChart.getAttribute("selectedDimensions")))
          )
        })
    )
    const getData = getSparklineDataFetcher(owner)
    const activeRequests = Array.from({ length: sparklineRequestLimits.concurrency }, (_, index) =>
      getData(makeAttrs(owner, index))
    )
    const controller = new AbortController()
    const queuedRequest = getData(makeAttrs(owner, 99), { signal: controller.signal })

    controller.abort()
    await expect(queuedRequest).rejects.toMatchObject({ name: "AbortError" })
    resolvers.forEach(resolve => resolve())
    await Promise.all(activeRequests)

    expect(calls).toBe(sparklineRequestLimits.concurrency)
  })

  it("evicts the least recently used completed responses", async () => {
    let calls = 0
    const { owner } = makeOwner(async requestChart => {
      calls++
      return makePayload(requestChart.getAttribute("selectedDimensions"))
    })
    const getData = getSparklineDataFetcher(owner)
    const first = makeAttrs(owner, 0)

    await getData(first)
    for (let index = 1; index <= sparklineRequestLimits.cache; index++) {
      await getData(makeAttrs(owner, index))
    }
    await getData(first)

    expect(calls).toBe(sparklineRequestLimits.cache + 2)
  })
})
