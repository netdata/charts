import React from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { useComparisonData } from "./useComparisonData"
import { makeTestChart } from "@jest/testUtilities"
import { fetchComparisonData } from "./dataFetcher"
import ChartProvider from "@/components/provider"

jest.mock("./dataFetcher")

describe("useComparisonData", () => {
  let chart
  let wrapper

  const mockPeriods = [
    {
      id: "selected",
      label: "Selected timeframe",
      after: 1000,
      before: 2000,
      isBase: true,
      payload: { data: [[1, 50]], dimensions: ["cpu"] }
    },
    {
      id: "24h", 
      label: "24 hours before",
      after: 1000 - 86400,
      before: 2000 - 86400,
      payload: { data: [[1, 45]], dimensions: ["cpu"] }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    const { chart: testChart } = makeTestChart({
      attributes: {
        after: 1000,
        before: 2000,
        drawerAction: "compare",
        comparePeriods: mockPeriods,
        compareLoading: false,
        compareError: null
      }
    })
    
    chart = testChart
    wrapper = ({ children }) => <ChartProvider chart={chart}>{children}</ChartProvider>
  })

  it("returns periods from chart attributes", () => {
    const { result } = renderHook(() => useComparisonData(), { wrapper })
    
    expect(result.current.periods).toHaveLength(2)
    expect(result.current.periods[0]).toMatchObject({
      id: "selected",
      isBase: true,
      stats: expect.objectContaining({
        min: 50,
        avg: 50,
        max: 50,
        points: 1,
        dimensions: 1
      })
    })
    expect(result.current.periods[1]).toMatchObject({
      id: "24h",
      stats: expect.objectContaining({
        min: 45,
        avg: 45,
        max: 45,
        points: 1,
        dimensions: 1
      }),
      changes: expect.objectContaining({
        avg: expect.objectContaining({
          direction: "down",
          value: 10
        })
      })
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("returns loading state from chart attributes", () => {
    chart.updateAttribute("compareLoading", true)
    
    const { result } = renderHook(() => useComparisonData(), { wrapper })
    
    expect(result.current.loading).toBe(true)
  })

  it("returns error state from chart attributes", () => {
    const error = "Network error"
    chart.updateAttribute("compareError", error)
    
    const { result } = renderHook(() => useComparisonData(), { wrapper })
    
    expect(result.current.error).toBe(error)
  })

  it("fetches data when drawer action is compare", async () => {
    fetchComparisonData.mockResolvedValue([])
    
    renderHook(() => useComparisonData(), { wrapper })
    
    await waitFor(() => {
      expect(fetchComparisonData).toHaveBeenCalledWith(chart)
    })
  })

  it("does not fetch data when drawer action is not compare", async () => {
    chart.updateAttribute("drawerAction", "values")
    
    renderHook(() => useComparisonData(), { wrapper })
    
    await waitFor(() => {
      expect(fetchComparisonData).not.toHaveBeenCalled()
    })
  })

  it("refetches data when time range changes", async () => {
    fetchComparisonData.mockResolvedValue([])
    
    const { rerender } = renderHook(() => useComparisonData(), { wrapper })
    
    chart.updateAttribute("after", 2000)
    chart.updateAttribute("before", 3000)
    rerender()
    
    await waitFor(() => {
      expect(fetchComparisonData).toHaveBeenCalledTimes(2)
    })
  })

  it("handles fetch errors without throwing", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation()
    fetchComparisonData.mockRejectedValue(new Error("Fetch failed"))
    
    renderHook(() => useComparisonData(), { wrapper })
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch comparison data:", expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  it("does not fetch when chart is not available", async () => {
    const { chart: testChart } = makeTestChart({
      attributes: {
        after: 1000,
        before: 2000,
        drawerAction: "compare",
        comparePeriods: [],
        compareLoading: false,
        compareError: null
      }
    })
    
    const noChartWrapper = ({ children }) => <ChartProvider chart={testChart}>{children}</ChartProvider>
    testChart.getAttribute = jest.fn().mockReturnValue(undefined)
    
    renderHook(() => useComparisonData(), { wrapper: noChartWrapper })
    
    await waitFor(() => {
      expect(fetchComparisonData).not.toHaveBeenCalled()
    })
  })

  it("recalculates stats when switching to selectedArea tab", () => {
    chart.updateAttribute("overlays", {
      highlight: {
        range: [10, 20]
      }
    })
    
    const { result, rerender } = renderHook(() => useComparisonData(), { wrapper })
    
    const windowStats = result.current.periods[0].stats
    expect(windowStats.points).toBe(1)
    
    chart.updateAttribute("drawerTab", "selectedArea")
    rerender()
    
    const highlightStats = result.current.periods[0].stats
    
    expect(highlightStats).toBeNull()
  })
})