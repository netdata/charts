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
