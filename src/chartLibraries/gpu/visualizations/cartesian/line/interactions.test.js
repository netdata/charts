import { makeTestChart } from "@jest/testUtilities"
import makeChartUI from "@/sdk/makeChartUI"
import makeInteractions, { getClosestRow } from "./interactions"

describe("WebGPU line hit testing", () => {
  const data = [
    [1000, 1],
    [2000, 2],
    [3000, 3],
  ]

  it("finds the nearest aligned row without scanning every point", () => {
    expect(getClosestRow(data, 100)).toBe(0)
    expect(getClosestRow(data, 1700)).toBe(1)
    expect(getClosestRow(data, 2600)).toBe(2)
    expect(getClosestRow(data, 4000)).toBe(2)
  })

  it("reports no row for empty data", () => {
    expect(getClosestRow([], 1000)).toBe(-1)
  })

  it("forwards native canvas hover events through chartUI", () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeChartUI(sdk, chart)
    const canvas = document.createElement("canvas")
    const received = []
    chartUI.on("mousemove", event => received.push(["mousemove", event]))
    chartUI.on("mouseout", event => received.push(["mouseout", event]))

    const destroy = makeInteractions({
      chart,
      chartUI,
      canvas,
      getFrame: () => null,
      setDateWindow: () => {},
      clearDateWindow: () => {},
      setSelectionRect: () => {},
    })
    const move = new MouseEvent("mousemove", { clientX: 20, clientY: 30 })
    const leave = new MouseEvent("mouseleave", { clientX: 40, clientY: 50 })

    canvas.dispatchEvent(move)
    canvas.dispatchEvent(leave)

    expect(received).toEqual([
      ["mousemove", move],
      ["mouseout", leave],
    ])

    destroy()
    canvas.dispatchEvent(move)
    expect(received).toHaveLength(2)
  })
})
