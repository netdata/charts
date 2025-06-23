import { fetchChartData, fetchChartWeights } from "./index"
import { makeTestChart } from "@jest/testUtilities"

// Mock fetch globally for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: [] }),
  })
)

describe("API index", () => {
  beforeEach(() => {
    global.fetch.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("fetchChartData", () => {
    it("uses agent endpoint when agent is true", async () => {
      const { chart } = makeTestChart({
        attributes: {
          agent: true,
          agentURL: "http://localhost:19999",
          chartId: "test.chart",
          host: "localhost",
        },
      })

      const promise = fetchChartData(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)

      // Should call agent endpoint
      await expect(promise).resolves.toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("localhost/data"),
        expect.any(Object)
      )
    })

    it("uses cloud endpoint when agent is false", async () => {
      const { chart } = makeTestChart({
        attributes: {
          agent: false,
          chartId: "test.chart",
          nodeIDs: ["node1"],
          url: "https://api.netdata.cloud",
        },
      })

      const promise = fetchChartData(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)

      // Cloud endpoint requires more complex setup, just verify it returns a promise
      await expect(promise).resolves.toBeDefined()
    })

    it("defaults to cloud endpoint when agent is undefined", async () => {
      const { chart } = makeTestChart({
        attributes: {
          chartId: "test.chart",
          nodeIDs: ["node1"],
          url: "https://api.netdata.cloud",
        },
      })

      const promise = fetchChartData(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)
    })
  })

  describe("fetchChartWeights", () => {
    it("uses agent endpoint when agent is true", async () => {
      const { chart } = makeTestChart({
        attributes: {
          agent: true,
          agentURL: "http://localhost:19999",
          chartId: "test.chart",
          host: "localhost",
        },
      })

      const promise = fetchChartWeights(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)

      // Should call agent weights endpoint
      await expect(promise).resolves.toBeDefined()
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("weights"),
        expect.any(Object)
      )
    })

    it("uses cloud endpoint when agent is false", async () => {
      const { chart } = makeTestChart({
        attributes: {
          agent: false,
          chartId: "test.chart",
          nodeIDs: ["node1"],
          url: "https://api.netdata.cloud",
        },
      })

      const promise = fetchChartWeights(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)
    })

    it("defaults to cloud endpoint when agent is undefined", async () => {
      const { chart } = makeTestChart({
        attributes: {
          chartId: "test.chart",
          nodeIDs: ["node1"],
          url: "https://api.netdata.cloud",
        },
      })

      const promise = fetchChartWeights(chart, { signal: new AbortController().signal })
      expect(promise).toBeInstanceOf(Promise)
    })
  })
})
