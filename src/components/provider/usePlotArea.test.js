import { renderHookWithChart } from "@jest/testUtilities"
import { usePlotArea } from "./selectors"

describe("usePlotArea", () => {
  it("reads the renderer-agnostic getPlotArea() and returns left/width", () => {
    const { result, chart } = renderHookWithChart(() => usePlotArea(), {
      attributes: { chartLibrary: "dygraph" },
    })

    chart.getUI().getPlotArea = () => ({ left: 12, top: 3, width: 400, height: 200 })

    expect(result.current).toEqual({ left: 0, width: 0 })
  })
})
