import { getCurrentTimeRange, getChartAttributes, getComparisonPeriods, fetchComparisonData } from "./dataFetcher"
import { fetchChartData } from "@/sdk/makeChart/api"
import { makeTestChart } from "@jest/testUtilities"

jest.mock("@/sdk/makeChart/api")

describe("dataFetcher", () => {
  let chart
  let mockUpdateAttribute

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateAttribute = jest.fn()
    
    const { chart: testChart } = makeTestChart({
      attributes: {
        after: 1000,
        before: 2000,
        contextScope: ["system.cpu"],
        comparePeriods: [],
        compareLoading: false,
        compareError: null,
        customPeriods: [
          { id: "24h", label: "24 hours before", offsetSeconds: 86400 },
          { id: "7d", label: "7 days before", offsetSeconds: 604800 }
        ]
      }
    })
    
    chart = testChart
    chart.updateAttribute = mockUpdateAttribute
  })

  describe("getCurrentTimeRange", () => {
    it("returns after and before from chart attributes", () => {
      const result = getCurrentTimeRange(chart)
      
      expect(result).toEqual({
        after: 1000,
        before: 2000
      })
    })
  })

  describe("getChartAttributes", () => {
    it("returns chart attributes excluding comparison-specific ones", () => {
      const result = getChartAttributes(chart)
      
      expect(result).toHaveProperty("contextScope")
      expect(result).not.toHaveProperty("after")
      expect(result).not.toHaveProperty("before")
      expect(result).not.toHaveProperty("comparePeriods")
      expect(result).not.toHaveProperty("compareLoading")
      expect(result).not.toHaveProperty("compareError")
      expect(result).not.toHaveProperty("compareData")
    })
  })

  describe("getComparisonPeriods", () => {
    it("generates correct comparison periods with custom periods", () => {
      const timeRange = { after: 1000, before: 2000 }
      const customPeriods = [
        { id: "24h", label: "24 hours before", offsetSeconds: 86400 },
        { id: "7d", label: "7 days before", offsetSeconds: 604800 }
      ]
      const result = getComparisonPeriods(timeRange, customPeriods)
      
      expect(result).toHaveLength(3)
      
      expect(result[0]).toEqual({
        id: "selected",
        label: "Selected timeframe", 
        after: 1000,
        before: 2000,
        isBase: true
      })
      
      expect(result[1]).toEqual({
        id: "24h",
        label: "24 hours before",
        offsetSeconds: 86400,
        after: 1000 - 86400,
        before: 2000 - 86400
      })
      
      expect(result[2]).toEqual({
        id: "7d", 
        label: "7 days before",
        offsetSeconds: 604800,
        after: 1000 - 604800,
        before: 2000 - 604800
      })
    })

    it("generates only base period when no custom periods provided", () => {
      const timeRange = { after: 1000, before: 2000 }
      const result = getComparisonPeriods(timeRange, [])
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        id: "selected",
        label: "Selected timeframe", 
        after: 1000,
        before: 2000,
        isBase: true
      })
    })
  })

  describe("fetchComparisonData", () => {
    const mockRawPayload = {
      result: {
        data: [[1640995200, 50, 30], [1640995260, 60, 40]],
        labels: ["time", "cpu", "memory"],
        point: { value: 0 }
      }
    }
    
    const mockPayload = {
      data: [[1, 50, 30], [2, 60, 40]],
      dimensions: ["cpu", "memory"]
    }

    it("sets loading state and fetches data for all periods", async () => {
      fetchChartData.mockResolvedValue(mockRawPayload)
      
      const result = await fetchComparisonData(chart)
      
      expect(mockUpdateAttribute).toHaveBeenCalledWith("compareLoading", true)
      expect(mockUpdateAttribute).toHaveBeenCalledWith("compareError", null)
      
      expect(fetchChartData).toHaveBeenCalledTimes(3)
      
      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        id: "selected",
        payload: expect.objectContaining({
          data: expect.any(Array),
          labels: expect.arrayContaining(["time", "cpu", "memory", "ANOMALY_RATE", "ANNOTATIONS"])
        }),
        error: null
      })
    })

    it("updates chart attributes with results", async () => {
      fetchChartData.mockResolvedValue(mockRawPayload)
      
      await fetchComparisonData(chart)
      
      expect(mockUpdateAttribute).toHaveBeenCalledWith("comparePeriods", expect.any(Array))
      expect(mockUpdateAttribute).toHaveBeenCalledWith("compareLoading", false)
    })

    it("handles fetch errors correctly", async () => {
      const error = new Error("Network error")
      fetchChartData.mockRejectedValue(error)
      
      const result = await fetchComparisonData(chart)
      
      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        id: "selected",
        payload: null,
        error: "Network error"
      })
      
      expect(mockUpdateAttribute).toHaveBeenCalledWith("compareLoading", false)
    })

    it("passes correct parameters to fetchChartData", async () => {
      fetchChartData.mockResolvedValue(mockRawPayload)
      
      await fetchComparisonData(chart)
      
      expect(fetchChartData).toHaveBeenCalledWith(chart, expect.objectContaining({
        attrs: expect.objectContaining({
          after: 1000,
          before: 2000
        })
      }))
      
      expect(fetchChartData).toHaveBeenCalledWith(chart, expect.objectContaining({
        attrs: expect.objectContaining({
          after: 1000 - 86400,
          before: 2000 - 86400
        })
      }))
      
      expect(fetchChartData).toHaveBeenCalledWith(chart, expect.objectContaining({
        attrs: expect.objectContaining({
          after: 1000 - 604800,
          before: 2000 - 604800
        })
      }))
    })
  })
})