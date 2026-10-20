import { act } from "@testing-library/react"
import { makeTestChart, renderHookWithChart } from "@jest/testUtilities"
import { useChartUI } from "./selectors"

describe("useChartUI", () => {
  it("returns the current default UI and follows a renderer replacement", () => {
    const { sdk, chart } = makeTestChart({ attributes: { autoPlay: false } })
    const { result, unmount } = renderHookWithChart(() => useChartUI(), { chart })
    const dygraph = chart.getUI()
    expect(result.current).toBe(dygraph)

    act(() => sdk.getRoot().updateAttribute("timeSeriesRenderer", "uplot"))

    expect(result.current).toBe(chart.getUI())
    expect(result.current).not.toBe(dygraph)
    expect(typeof result.current.getUPlot).toBe("function")
    unmount()
    chart.destroy()
  })

  it("returns the named UI", () => {
    const { chart } = makeTestChart({ attributes: { autoPlay: false } })
    chart.makeChartUI("custom", "bars")
    const { result, unmount } = renderHookWithChart(() => useChartUI("custom"), { chart })
    expect(result.current).toBe(chart.getUI("custom"))
    unmount()
    chart.destroy()
  })
})
