import { act } from "@testing-library/react"
import { renderHookWithChart } from "@jest/testUtilities"
import { usePlotArea } from "./selectors"

describe("usePlotArea", () => {
  it("reads the renderer-agnostic getPlotArea() and returns left/top/width", () => {
    const { result, chart } = renderHookWithChart(() => usePlotArea(), {
      attributes: { chartLibrary: "dygraph" },
    })

    expect(result.current).toEqual({ left: 0, top: 0, width: 0 })

    chart.getUI().getPlotArea = () => ({ left: 12, top: 3, width: 400, height: 200 })
    act(() => chart.getUI().trigger("rendered"))

    expect(result.current).toEqual({ left: 12, top: 3, width: 400 })
  })
})
