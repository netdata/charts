import React from "react"
import { act, renderHook, waitFor } from "@testing-library/react"
import useData from "./useData"
import { makeTestChart } from "@jest/testUtilities"
import ChartProvider from "@/components/provider"

const periods = [
  {
    id: "selected",
    label: "Selected timeframe",
    after: 1000,
    before: 2000,
    isBase: true,
    payload: { data: [[1, 50]], labels: ["time", "cpu"] },
  },
  {
    id: "24h",
    label: "24 hours before",
    after: 1000 - 86400,
    before: 2000 - 86400,
    payload: { data: [[1, 45]], labels: ["time", "cpu"] },
  },
]

const makeRawPayload = () => ({
  result: {
    labels: ["time", "cpu"],
    point: { value: 0 },
    data: [[1000, [50]]],
  },
  view: { update_every: 5 },
})

const loadChart = chart =>
  new Promise(resolve => {
    const unsubscribe = chart.on("successFetch", () => {
      unsubscribe()
      resolve()
    })
    chart.fetch()
  })

describe("useData", () => {
  let chart
  let wrapper

  beforeEach(() => {
    chart = makeTestChart({
      attributes: {
        after: 1000,
        before: 2000,
        drawer: { action: "values" },
        comparePeriods: periods,
        compareLoading: false,
        compareError: null,
      },
    }).chart

    wrapper = ({ children }) => <ChartProvider chart={chart}>{children}</ChartProvider>
  })

  it("returns comparison statistics from chart attributes", () => {
    const { result } = renderHook(() => useData(), { wrapper })

    expect(result.current.periods).toHaveLength(2)
    expect(result.current.periods[0]).toMatchObject({
      id: "selected",
      isBase: true,
      stats: {
        min: 50,
        avg: 50,
        max: 50,
        points: 1,
        dimensions: 1,
      },
    })
    expect(result.current.periods[1]).toMatchObject({
      id: "24h",
      stats: { min: 45, avg: 45, max: 45, points: 1, dimensions: 1 },
      changes: {
        avg: { direction: "down", value: 10, formatted: "10.0%" },
      },
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("returns loading and error state from chart attributes", () => {
    chart.updateAttributes({ compareLoading: true, compareError: "Network error" })

    const { result } = renderHook(() => useData(), { wrapper })

    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBe("Network error")
  })

  it("does not request comparisons before the initial main-chart success", async () => {
    chart.updateAttribute("drawer.action", "compare")
    const getChart = chart.getChart
    let calls = 0
    chart.getChart = (...args) => {
      calls++
      return getChart(...args)
    }

    renderHook(() => useData(), { wrapper })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(calls).toBe(0)

    await act(() => loadChart(chart))
    await waitFor(() => expect(calls).toBe(2))
  })

  it("loads only historical periods when Compare opens on a loaded chart", async () => {
    await loadChart(chart)
    chart.updateAttribute("drawer.action", "compare")
    const getChart = chart.getChart
    let calls = 0
    chart.getChart = (...args) => {
      calls++
      return getChart(...args)
    }

    renderHook(() => useData(), { wrapper })

    await waitFor(() => expect(chart.getAttribute("comparePeriods")).toHaveLength(3))
    expect(calls).toBe(2)
    expect(chart.getAttribute("comparePeriods")[0].payload.data).toBe(chart.getPayload().data)
  })

  it("does not load comparison data for another drawer action", async () => {
    chart.updateAttribute("comparePeriods", [])

    renderHook(() => useData(), { wrapper })

    await new Promise(resolve => setTimeout(resolve, 10))
    expect(chart.getAttribute("comparePeriods")).toEqual([])
  })

  it("keeps a shared request alive when one hook consumer unmounts", async () => {
    await loadChart(chart)
    chart.updateAttribute("drawer.action", "compare")
    const resolvers = []
    let calls = 0
    let aborts = 0
    chart.getChart = (requestChart, { signal }) =>
      new Promise((resolve, reject) => {
        if (requestChart !== chart) throw new Error("Unexpected comparison chart")
        calls++
        signal.addEventListener("abort", () => {
          aborts++
          const error = new Error("Aborted")
          error.name = "AbortError"
          reject(error)
        })
        resolvers.push(resolve)
      })

    const first = renderHook(() => useData(), { wrapper })
    const second = renderHook(() => useData(), { wrapper })
    await waitFor(() => expect(calls).toBe(2))

    first.unmount()
    expect(aborts).toBe(0)
    resolvers.forEach(resolve => resolve(makeRawPayload()))

    await waitFor(() => expect(chart.getAttribute("comparePeriods")).toHaveLength(3))
    expect(aborts).toBe(0)
    second.unmount()
  })

  it("recalculates statistics for the selected area without fetching", () => {
    chart.updateAttribute("overlays", {
      highlight: {
        range: [10, 20],
      },
    })

    const { result } = renderHook(() => useData(), { wrapper })
    expect(result.current.periods[0].stats.points).toBe(1)

    act(() => chart.updateAttribute("drawer.tab", "selectedArea"))

    expect(result.current.periods[0].stats).toBeNull()
  })
})
