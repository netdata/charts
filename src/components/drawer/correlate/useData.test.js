import { getCorrelationQueryAttributes } from "./useData"

describe("getCorrelationQueryAttributes", () => {
  it("queries all selectors within the available node scope and groups by context", () => {
    const timeRange = {
      highlightAfter: 100,
      highlightBefore: 200,
      baselineAfter: 0,
      baselineBefore: 100,
    }

    expect(
      getCorrelationQueryAttributes({
        timeRange,
        method: "ks2",
        aggregation: "median",
        dataType: "anomaly-bit",
        nodesScope: ["node-a", "node-b"],
      })
    ).toEqual({
      ...timeRange,
      baselineAfter: -300,
      method: "ks2",
      aggregationMethod: "median",
      options: ["anomaly-bit"],
      groupBy: ["node", "context", "dimension"],
      groupByLabel: [],
      contextScope: [],
      nodesScope: ["node-a", "node-b"],
      selectedContexts: [],
      selectedNodes: [],
      selectedInstances: [],
      selectedDimensions: [],
      selectedLabels: [],
    })
  })

  it.each([
    [3599, 4],
    [3600, 2],
    [21599, 2],
    [21600, 1],
  ])("uses an adaptive baseline for a %s-second window", (duration, multiplier) => {
    const attributes = getCorrelationQueryAttributes({
      timeRange: { highlightAfter: 100000, highlightBefore: 100000 + duration },
      method: "volume",
      nodesScope: ["node-a"],
    })
    expect(attributes.baselineAfter).toBe(100000 - duration * multiplier)
    expect(attributes.baselineBefore).toBe(100000)
  })

  it("does not add an empty data option", () => {
    const attributes = getCorrelationQueryAttributes({
      timeRange: {},
      method: "volume",
      aggregation: "average",
      dataType: "",
      nodesScope: undefined,
    })

    expect(attributes.options).toEqual([])
  })
})
