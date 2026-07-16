import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import makeAnnotations from "./annotations"

const after = 1617946860
const before = 1617947760

const withAnnotationsPayload = chart => {
  chart.getPayload = () => ({
    data: [
      [after * 1000, 10, 20, 30],
      [(after + 5) * 1000, 12, 18, 28],
      [(after + 10) * 1000, 11, 22, 31],
    ],
    all: [
      [after * 1000, { pa: 1 }, { pa: 2 }, { pa: 4 }],
      [(after + 5) * 1000, { pa: 0 }, { pa: 0 }, { pa: 0 }],
      [(after + 10) * 1000, { pa: 1 }, { pa: 0 }, { pa: 2 }],
    ],
    point: {},
    labels: ["time", "load1", "load5", "load15", "ANOMALY_RATE", "ANNOTATIONS"],
  })
  chart.getPayloadDimensionIds = () => ["load1", "load5", "load15"]
  chart.getVisibleDimensionIds = () => ["load1", "load5", "load15"]
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#E4E8E8"
  chart.getConvertedValueWithUnit = value => `${value}`
  chart.getClosestRow = tsMs => chart.getPayload().data.findIndex(row => row[0] === tsMs)
}

const mountUplot = (attributes = {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: {
      loaded: true,
      chartType: "line",
      chartLibrary: "uplot",
      after,
      before,
      staticValueRange: [5, 40],
      ...attributes,
    },
  })
  withAnnotationsPayload(chart)

  const instance = uplotChart(sdk, chart)
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "300px"
  document.body.appendChild(element)
  instance.mount(element)

  return {
    chart,
    instance,
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

describe("uplot annotations strip draw hook", () => {
  it("is registered in the uPlot draw hooks", () => {
    const { instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    expect(() => u.hooks.draw.forEach(hook => hook(u))).not.toThrow()

    teardown()
  })

  it("draws the transparent background strip plus colored strips for flagged rows", () => {
    const { instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    const fillSpy = jest.spyOn(u.ctx, "fillRect")
    const strokeSpy = jest.spyOn(u.ctx, "strokeRect")

    makeAnnotations(instance)(u)

    const points = 3
    expect(fillSpy.mock.calls.length).toBeGreaterThan(points)
    expect(strokeSpy).toHaveBeenCalled()

    fillSpy.mockRestore()
    strokeSpy.mockRestore()
    teardown()
  })

  it("draws the colored strips with reduced intensity and restores the alpha", () => {
    const { instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    const alphas = []
    jest.spyOn(u.ctx, "fillRect").mockImplementation(() => {
      alphas.push(u.ctx.globalAlpha)
    })

    makeAnnotations(instance)(u)

    expect(alphas).toContain(0.45)
    expect(u.ctx.globalAlpha).toBe(1)

    u.ctx.fillRect.mockRestore()
    teardown()
  })

  it("does not draw when showAnnotations is disabled", () => {
    const { instance, teardown } = mountUplot({ showAnnotations: false })
    const u = instance.getUPlot()

    const fillSpy = jest.spyOn(u.ctx, "fillRect")

    makeAnnotations(instance)(u)

    expect(fillSpy).not.toHaveBeenCalled()

    fillSpy.mockRestore()
    teardown()
  })
})
