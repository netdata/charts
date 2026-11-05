import { groupByContext, transformCorrelationData } from "./dataTransformer"

const schema = {
  type: "array",
  items: [{ name: "weight" }, { name: "timeframe" }, { name: "baseline timeframe" }],
}

const makeItem = ({
  dimension = "dimension-id",
  dimensionName = "Dimension name",
  context = "context-id",
  contextName = "Context name",
  node = "node-id",
  nodeName = "Node name",
  weight = 0.005,
  timeframeAvg = 15,
  baselineAvg = 10,
} = {}) => ({
  values: { dimension, context, node },
  names: { dimension: dimensionName, context: contextName, node: nodeName },
  v: [
    [weight, weight, weight, weight, 1],
    [0, timeframeAvg, 0, 0, 10, 0],
    [0, baselineAvg, 0, 0, 8, 0],
  ],
})

const makeResponse = (items, groupBy = ["dimension", "node", "context"]) => ({
  request: { aggregations: { metrics: [{ group_by: groupBy }] } },
  v_schema: schema,
  result: items.map(item => ({
    id: groupBy.map(field => item.values[field]).join(","),
    nm: groupBy.map(field => item.names[field]).join(","),
    v: item.v,
  })),
})

describe("transformCorrelationData", () => {
  it.each([
    ["dimension", "node", "context"],
    ["node", "context", "dimension"],
    ["context", "dimension", "node"],
  ])("uses the response group order: %s, %s, %s", (...groupBy) => {
    const [result] = transformCorrelationData(makeResponse([makeItem()], groupBy), 0.01)

    expect(result).toMatchObject({
      dimension: "dimension-id",
      dimensionName: "Dimension name",
      context: "context-id",
      contextName: "Context name",
      nodeId: "node-id",
      nodeName: "Node name",
      correlationWeight: 0.005,
      percentChange: 50,
    })
  })

  it("rejects responses that cannot identify every required group", () => {
    const response = makeResponse([makeItem()], ["node", "dimension"])

    expect(transformCorrelationData(response)).toEqual([])
    expect(transformCorrelationData({ result: [], v_schema: schema })).toEqual([])
  })

  it("filters by threshold and excludes the chart's own contexts", () => {
    const response = makeResponse([
      makeItem({ context: "current", weight: 0.001 }),
      makeItem({ context: "included", weight: -0.009 }),
      makeItem({ context: "too-weak", weight: 0.01 }),
    ])

    const result = transformCorrelationData(response, 0.01, ["current"])

    expect(result.map(item => item.context)).toEqual(["included"])
  })

  it("ignores malformed result rows", () => {
    const response = makeResponse([makeItem()])
    response.result.push({ id: "invalid", nm: "invalid", v: [] })

    expect(transformCorrelationData(response, 0.01)).toHaveLength(1)
  })
})

describe("groupByContext", () => {
  it("builds stable hierarchical rows ordered by strongest correlation", () => {
    const response = makeResponse([
      makeItem({ dimension: "a", context: "context-a", weight: 0.008 }),
      makeItem({ dimension: "b", context: "context-b", weight: 0.002 }),
      makeItem({ dimension: "c", context: "context-a", weight: 0.004 }),
    ])

    const result = groupByContext(transformCorrelationData(response, 0.01))

    expect(result.map(group => group.context)).toEqual(["context-b", "context-a"])
    expect(result[1]).toMatchObject({
      rowId: JSON.stringify(["context", "context-a"]),
      kind: "context",
      count: 2,
      minWeight: 0.004,
    })
    expect(result[1].children.map(item => item.dimension)).toEqual(["c", "a"])
  })

  it("groups thousands of rows without duplicating leaf objects", () => {
    const items = Array.from({ length: 6000 }, (_, index) =>
      makeItem({
        dimension: `dimension-${index}`,
        context: `context-${index % 100}`,
        weight: (index + 1) / 1_000_000,
      })
    )
    const flatData = transformCorrelationData(makeResponse(items), 1)
    const result = groupByContext(flatData)

    expect(result).toHaveLength(100)
    expect(result.reduce((count, group) => count + group.children.length, 0)).toBe(6000)
    expect(result[0].children[0]).toBe(flatData[0])
  })
})
