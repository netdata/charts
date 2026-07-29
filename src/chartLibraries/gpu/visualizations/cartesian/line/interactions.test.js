import { makeTestChart } from "@jest/testUtilities"
import makeChartUI from "@/sdk/makeChartUI"
import makeInteractions, { getClosestRow } from "./interactions"

describe("GPU line interactions", () => {
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

  it("does not start or commit a pan without crossing the drag threshold", () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeChartUI(sdk, chart)
    const canvas = document.createElement("canvas")
    const events = []
    const dateWindows = []
    sdk.on("panStart", () => events.push("start"))
    sdk.on("panEnd", () => events.push("end"))
    sdk.on("highlightStart", () => events.push("highlight"))

    const destroy = makeInteractions({
      chart,
      chartUI,
      canvas,
      getFrame: () => ({
        afterMs: 1000,
        beforeMs: 2000,
        domain: [0, 10],
        plot: { left: 0, top: 0, width: 100, height: 100 },
      }),
      setDateWindow: range => dateWindows.push(range),
      clearDateWindow: () => events.push("clear"),
      setSelectionRect: () => {},
    })

    canvas.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 50, clientY: 50 }))
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 53, clientY: 50 }))
    window.dispatchEvent(new MouseEvent("mouseup", { clientX: 53, clientY: 50 }))

    expect(events).toEqual([])
    expect(dateWindows).toEqual([])
    expect(chart.getAttribute("after")).toBe(-900)
    expect(chart.getAttribute("before")).toBe(0)
    expect(chart.getAttribute("panning")).toBe(false)
    destroy()
  })

  it("starts and commits a pan after crossing the drag threshold", () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeChartUI(sdk, chart)
    const canvas = document.createElement("canvas")
    const events = []
    const dateWindows = []
    sdk.on("panStart", () => events.push("start"))
    sdk.on("panEnd", () => events.push("end"))

    const destroy = makeInteractions({
      chart,
      chartUI,
      canvas,
      getFrame: () => ({
        afterMs: 1000,
        beforeMs: 2000,
        domain: [0, 10],
        plot: { left: 0, top: 0, width: 100, height: 100 },
      }),
      setDateWindow: range => dateWindows.push(range),
      clearDateWindow: () => events.push("clear"),
      setSelectionRect: () => {},
    })

    canvas.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 50, clientY: 50 }))
    window.dispatchEvent(new MouseEvent("mousemove", { clientX: 60, clientY: 50 }))
    window.dispatchEvent(new MouseEvent("mouseup", { clientX: 60, clientY: 50 }))

    expect(events).toEqual(["start", "end", "clear"])
    expect(dateWindows).toEqual([[900, 1900]])
    expect(chart.getAttribute("panning")).toBe(false)
    destroy()
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
