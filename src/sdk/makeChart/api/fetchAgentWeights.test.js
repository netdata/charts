import fetchAgentWeights from "./fetchAgentWeights"
import { makeTestChart } from "@jest/testUtilities"

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ result: [] }),
  })
)

describe("fetchAgentWeights", () => {
  let chart

  beforeEach(() => {
    jest.clearAllMocks()

    const { chart: testChart } = makeTestChart({
      attributes: {
        host: "http://localhost:19999",
        groupBy: ["dimension"],
        groupByLabel: [],
        selectedContexts: ["system.cpu"],
        selectedInstances: [],
        selectedDimensions: [],
        selectedLabels: [],
        contextScope: ["system"],
        nodesScope: [],
        after: 1000,
        before: 2000,
        points: 100,
      },
    })

    chart = testChart
    chart.updateAttribute("aggregationMethod", "sum")
  })

  it("uses chart attributes as defaults", async () => {
    await fetchAgentWeights(chart)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("localhost:19999/weights"),
      expect.any(Object)
    )

    const callUrl = global.fetch.mock.calls[0][0]
    const urlParams = new URLSearchParams(callUrl.split("?")[1])

    expect(urlParams.get("group_by")).toBe("dimension")
    expect(urlParams.get("aggregation")).toBe("sum")
    expect(urlParams.get("contexts")).toBe("system.cpu")
  })

  it("overrides chart attributes with custom attrs", async () => {
    await fetchAgentWeights(chart, {
      attrs: {
        groupBy: ["node", "instance"],
        groupByLabel: ["custom_label"],
        aggregationMethod: "avg",
        after: 3000,
        before: 4000,
      },
    })

    const callUrl = global.fetch.mock.calls[0][0]
    const urlParams = new URLSearchParams(callUrl.split("?")[1])

    expect(urlParams.get("group_by")).toBe("node|instance")
    expect(urlParams.get("group_by_label")).toBe("custom_label")
    expect(urlParams.get("aggregation")).toBe("avg")
    expect(urlParams.get("after")).toBe("3000")
    expect(urlParams.get("before")).toBe("4000")
  })

  it("handles empty groupByLabel correctly", async () => {
    await fetchAgentWeights(chart, {
      attrs: {
        groupBy: ["dimension"],
        groupByLabel: [],
      },
    })

    const callUrl = global.fetch.mock.calls[0][0]
    const urlParams = new URLSearchParams(callUrl.split("?")[1])

    expect(urlParams.get("group_by")).toBe("dimension")
    expect(urlParams.has("group_by_label")).toBe(false)
  })

  it("merges custom options with chart options", async () => {
    await fetchAgentWeights(chart, {
      attrs: {
        options: ["custom", "option"],
      },
    })

    const callUrl = global.fetch.mock.calls[0][0]
    const urlParams = new URLSearchParams(callUrl.split("?")[1])

    expect(urlParams.get("options")).toContain("custom")
    expect(urlParams.get("options")).toContain("option")
  })

  it("passes through additional fetch options", async () => {
    const signal = new AbortController().signal

    await fetchAgentWeights(chart, {
      signal,
      headers: { "Custom-Header": "value" },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/weights"),
      expect.objectContaining({
        signal,
        headers: { "Custom-Header": "value" },
      })
    )
  })
})
