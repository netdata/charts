import genericNavigation from "./generic"

const getHandler = (chartUI, eventName) =>
  chartUI.on.mock.calls.find(([name]) => name === eventName)[1]

const makeChartUI = () => {
  const chartUI = {
    sdk: {
      trigger: jest.fn(),
    },
    chart: {
      getAttribute: jest.fn(),
      updateAttributes: jest.fn(),
      updateAttribute: jest.fn(),
      resetNavigation: jest.fn(),
      getPropertiesForSeries: jest.fn(),
    },
    trigger: jest.fn(),
    on: jest.fn(() => chartUI),
    off: jest.fn(() => chartUI),
  }
  return chartUI
}

const makeDygraph = () => ({
  toDataXCoord: jest.fn(() => 0),
  toDataYCoord: jest.fn(() => 0),
  xAxisRange: jest.fn(() => [0, 1]),
  yAxisRange: jest.fn(() => [0, 1]),
  plotter_: { area: { w: 100, h: 100 } },
  axes_: [{}],
  attributes_: { getForAxis: jest.fn(() => false) },
  drawGraph_: jest.fn(),
  getFunctionOption: jest.fn(),
})

const makeTouchEvent = (touches, changedTouches = []) => ({
  touches,
  changedTouches,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
})

describe("generic navigation touch handling", () => {
  let chartUI
  let dygraph
  let context
  let touchStart
  let touchMove
  let touchEnd

  beforeEach(() => {
    chartUI = makeChartUI()
    genericNavigation(chartUI)
    touchStart = getHandler(chartUI, "touchstart")
    touchMove = getHandler(chartUI, "touchmove")
    touchEnd = getHandler(chartUI, "touchend")
    dygraph = makeDygraph()
    context = {}
  })

  it("does not throw on touchstart when a touch target has no getBoundingClientRect", () => {
    const event = makeTouchEvent([
      { target: document.createTextNode("x"), pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])

    expect(() => touchStart(event, dygraph, context)).not.toThrow()
  })

  it("does not throw on touchmove after a touchstart that failed to record initialTouches", () => {
    const startEvent = makeTouchEvent([
      { target: document.createTextNode("x"), pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])
    try {
      touchStart(startEvent, dygraph, context)
    } catch {}

    const moveEvent = makeTouchEvent([{ pageX: 20, pageY: 20 }])

    expect(() => touchMove(moveEvent, dygraph, context)).not.toThrow()
  })

  it("still delegates to dygraph's default interaction model for an Element target", () => {
    const element = document.createElement("div")
    const startEvent = makeTouchEvent([
      { target: element, pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])

    touchStart(startEvent, dygraph, context)

    expect(context.initialTouches).toEqual([{ pageX: 10, pageY: 10, dataX: 0, dataY: 0 }])

    const moveEvent = makeTouchEvent([{ pageX: 15, pageY: 15 }])

    expect(() => touchMove(moveEvent, dygraph, context)).not.toThrow()
    expect(dygraph.drawGraph_).toHaveBeenCalledWith(false)
  })

  it("does not throw on touchmove after a valid one-finger touchstart is followed by an invalid two-finger touchstart", () => {
    const element = document.createElement("div")
    const oneFingerStart = makeTouchEvent([
      { target: element, pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])
    touchStart(oneFingerStart, dygraph, context)

    const twoFingerStart = makeTouchEvent([
      { target: element, pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
      { target: document.createTextNode("x"), pageX: 20, pageY: 20, clientX: 20, clientY: 20 },
    ])
    touchStart(twoFingerStart, dygraph, context)

    const twoFingerMove = makeTouchEvent([
      { pageX: 12, pageY: 12 },
      { pageX: 22, pageY: 22 },
    ])

    expect(() => touchMove(twoFingerMove, dygraph, context)).not.toThrow()
  })

  it("does not throw on touchend re-entry when a remaining touch has an invalid target", () => {
    const element = document.createElement("div")
    const startEvent = makeTouchEvent([
      { target: element, pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])
    touchStart(startEvent, dygraph, context)

    const endEvent = makeTouchEvent([
      { target: document.createTextNode("x"), pageX: 10, pageY: 10 },
    ])

    expect(() => touchEnd(endEvent, dygraph, context)).not.toThrow()
  })

  it("still delegates the normal touchend path (clickX) when the gesture is valid", () => {
    const element = document.createElement("div")
    const startEvent = makeTouchEvent([
      { target: element, pageX: 10, pageY: 10, clientX: 10, clientY: 10 },
    ])
    touchStart(startEvent, dygraph, context)

    const endEvent = makeTouchEvent([], [{ screenX: 10, screenY: 10 }])

    touchEnd(endEvent, dygraph, context)

    expect(chartUI.chart.updateAttribute).toHaveBeenCalledWith("clickX", [0, null])
  })
})
