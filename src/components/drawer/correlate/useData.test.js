import { makeTestChart } from "@jest/testUtilities"
import { fetchChartWeights } from "@/sdk/makeChart/api"
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
      dimensionsScope: [],
    })
  })

  it("stays inside the chart's label scope", async () => {
    const { chart } = makeTestChart({
      attributes: {
        agent: true,
        host: "http://localhost:19999",
        labelsScope: ["device:sda"],
        dimensionsScope: ["reads"],
      },
    })
    const originalFetch = global.fetch
    const urls = []
    global.fetch = url => {
      urls.push(url)
      return Promise.resolve({ json: () => Promise.resolve({}) })
    }
    try {
      await fetchChartWeights(chart, {
        attrs: getCorrelationQueryAttributes({
          timeRange: { highlightAfter: 100000, highlightBefore: 103600 },
          method: "volume",
          nodesScope: ["node-a"],
        }),
      })
      const params = new URLSearchParams(urls[0].split("?")[1])
      expect(params.get("scope_labels")).toBe("device:sda")
      expect(params.has("scope_dimensions")).toBe(false)
    } finally {
      global.fetch = originalFetch
      chart.destroy()
    }
  })

  it.each(["volume", "ks2"])("sends drawer %s windows with the adaptive baseline", async method => {
    const { chart } = makeTestChart({
      attributes: { agent: true, host: "http://localhost:19999" },
    })
    const originalFetch = global.fetch
    const urls = []
    global.fetch = url => {
      urls.push(url)
      return Promise.resolve({ json: () => Promise.resolve({}) })
    }
    try {
      await fetchChartWeights(chart, {
        attrs: getCorrelationQueryAttributes({
          timeRange: { highlightAfter: 100000, highlightBefore: 103600 },
          method,
          nodesScope: ["node-a"],
        }),
      })
      const params = new URLSearchParams(urls[0].split("?")[1])
      expect(params.get("after")).toBe("100000")
      expect(params.get("before")).toBe("103600")
      expect(params.get("baseline_after")).toBe("92800")
      expect(params.get("baseline_before")).toBe("100000")
    } finally {
      global.fetch = originalFetch
      chart.destroy()
    }
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
