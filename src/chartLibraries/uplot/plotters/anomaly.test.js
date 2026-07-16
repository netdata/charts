import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import makeAnomaly from "./anomaly"

const after = 1617946860
const before = 1617947760

const withAnomalyPayload = chart => {
  chart.getPayload = () => ({
    data: [
      [after * 1000, 10, 20, 30],
      [(after + 5) * 1000, 12, 18, 28],
      [(after + 10) * 1000, 11, 22, 31],
    ],
    all: [
      [after * 1000, { arp: 25 }, { arp: 50 }, { arp: 10 }],
      [(after + 5) * 1000, { arp: 75 }, { arp: 100 }, { arp: 0 }],
      [(after + 10) * 1000, { arp: 0 }, { arp: 5 }, { arp: 90 }],
    ],
    point: {},
    labels: ["time", "load1", "load5", "load15", "ANOMALY_RATE", "ANNOTATIONS"],
  })
  chart.getPayloadDimensionIds = () => ["load1", "load5", "load15"]
  chart.getVisibleDimensionIds = () => ["load1", "load5", "load15"]
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#9F75F9"
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
  withAnomalyPayload(chart)

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

describe("uplot anomaly ribbon draw hook", () => {
  it("is registered in the uPlot draw hooks", () => {
    const { instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    expect(u.hooks.draw.length).toBeGreaterThan(0)
    expect(() => u.hooks.draw.forEach(hook => hook(u))).not.toThrow()

    teardown()
  })

  it("fills a ribbon rect per data point when showAnomalies is on", () => {
    const { chart, instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    const fillSpy = jest.spyOn(u.ctx, "fillRect")
    const strokeSpy = jest.spyOn(u.ctx, "strokeRect")

    makeAnomaly(instance)(u)

    const points = chart.getPayload().data.length
    expect(fillSpy).toHaveBeenCalledTimes(points)
    expect(strokeSpy).toHaveBeenCalledTimes(points)

    fillSpy.mockRestore()
    strokeSpy.mockRestore()
    teardown()
  })

  it("colors the ribbon using the max anomaly rate across selected dimensions", () => {
    const { instance, teardown } = mountUplot()
    const u = instance.getUPlot()

    const colorSpy = jest.spyOn(u.ctx, "fillRect")
    const closestSpy = jest.spyOn(instance.chart, "getClosestRow")

    makeAnomaly(instance)(u)

    expect(closestSpy).toHaveBeenCalled()
    expect(colorSpy).toHaveBeenCalled()

    colorSpy.mockRestore()
    closestSpy.mockRestore()
    teardown()
  })

  it("does not draw when showAnomalies is disabled", () => {
    const { instance, teardown } = mountUplot({ showAnomalies: false })
    const u = instance.getUPlot()

    const fillSpy = jest.spyOn(u.ctx, "fillRect")

    makeAnomaly(instance)(u)

    expect(fillSpy).not.toHaveBeenCalled()

    fillSpy.mockRestore()
    teardown()
  })
})
