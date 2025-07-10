import fetchCloudWeights from "./fetchCloudWeights"
import { makeTestChart } from "@jest/testUtilities"

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ result: [] }),
  })
)

describe("fetchCloudWeights", () => {
  let chart

  beforeEach(() => {
    jest.clearAllMocks()

    const { chart: testChart } = makeTestChart({
      attributes: {
        host: "https://api.netdata.cloud",
        groupBy: ["dimension"],
        groupByLabel: [],
        aggregationMethod: "sum",
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
  })

  it("uses chart attributes as defaults", async () => {
    await fetchCloudWeights(chart)

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.netdata.cloud/weights",
      expect.objectContaining({
        method: "POST",
        body: expect.any(String),
      })
    )

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.aggregations.metrics[0].group_by).toEqual(["dimension"])
    expect(payload.aggregations.metrics[0].aggregation).toBe("sum")
    expect(payload.selectors.contexts).toEqual(["system.cpu"])
  })

  it("overrides chart attributes with custom attrs", async () => {
    await fetchCloudWeights(chart, {
      attrs: {
        groupBy: ["node", "instance"],
        groupByLabel: ["custom_label"],
        aggregationMethod: "avg",
        after: 3000,
        before: 4000,
        points: 200,
      },
    })

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.aggregations.metrics[0].group_by).toEqual(["node", "instance"])
    expect(payload.aggregations.metrics[0].group_by_label).toEqual(["custom_label"])
    expect(payload.aggregations.metrics[0].aggregation).toBe("avg")
    expect(payload.window.after).toBe(3)
    expect(payload.window.before).toBe(4)
    expect(payload.window.points).toBe(200)
    expect(payload.window.baseline.after).toBe(3)
    expect(payload.window.baseline.before).toBe(4)
  })

  it("uses highlight window when provided with baseline fallback", async () => {
    await fetchCloudWeights(chart, {
      attrs: {
        after: 1000,
        before: 2000,
        highlightAfter: 1500,
        highlightBefore: 1800,
      },
    })

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.window.after).toBe(1)
    expect(payload.window.before).toBe(1)
    expect(payload.window.baseline.after).toBe(1)
    expect(payload.window.baseline.before).toBe(2)
  })

  it("falls back to main range when no highlight provided", async () => {
    await fetchCloudWeights(chart, {
      attrs: {
        after: 3000,
        before: 4000,
      },
    })

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.window.after).toBe(3)
    expect(payload.window.before).toBe(4)
    expect(payload.window.baseline.after).toBe(3)
    expect(payload.window.baseline.before).toBe(4)
  })

  it("handles weights-specific attributes", async () => {
    await fetchCloudWeights(chart, {
      attrs: {
        method: "custom-method",
      },
    })

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.method).toBe("custom-method")
  })

  it("merges custom options with default options", async () => {
    await fetchCloudWeights(chart, {
      attrs: {
        options: ["custom", "option"],
      },
    })

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.options).toContain("custom")
    expect(payload.options).toContain("option")
    expect(payload.options).toContain("minify")
    expect(payload.options).toContain("nonzero")
    expect(payload.options).toContain("unaligned")
  })

  it("uses default method when not provided", async () => {
    await fetchCloudWeights(chart)

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.method).toBe("ks2")
  })

  it("includes timeout and default structure", async () => {
    await fetchCloudWeights(chart)

    const payload = JSON.parse(global.fetch.mock.calls[0][1].body)

    expect(payload.timeout).toBe(180_000)
    expect(payload).toHaveProperty("selectors")
    expect(payload).toHaveProperty("aggregations")
    expect(payload).toHaveProperty("window")
    expect(payload).toHaveProperty("scope")
  })

  it("passes through additional fetch options", async () => {
    const signal = new AbortController().signal

    await fetchCloudWeights(chart, {
      signal,
      headers: { "Custom-Header": "value" },
    })

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.netdata.cloud/weights",
      expect.objectContaining({
        method: "POST",
        signal,
        headers: { "Custom-Header": "value" },
      })
    )
  })
})
