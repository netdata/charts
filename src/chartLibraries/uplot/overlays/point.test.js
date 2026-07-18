import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import types from "./types"
import point from "./point"

const after = 1617946860
const before = 1617947760

const withLoadedPayload = chart => {
  chart.getPayload = () => ({
    data: [
      [after * 1000, 10, 20, 30],
      [(after + 5) * 1000, 12, 18, 28],
      [(after + 10) * 1000, 11, 22, 31],
    ],
    labels: ["time", "load1", "load5", "load15"],
  })
  chart.getPayloadDimensionIds = () => ["load1", "load5", "load15"]
  chart.getVisibleDimensionIds = () => ["load1", "load5", "load15"]
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#E4E8E8"
  chart.getConvertedValueWithUnit = value => `${value}`
}

const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))

const mountUplot = async overlays => {
  const { sdk, chart } = makeTestChart({
    attributes: {
      loaded: true,
      chartType: "line",
      chartLibrary: "uplot",
      after,
      before,
      staticValueRange: [5, 40],
      overlays,
    },
  })
  withLoadedPayload(chart)

  const instance = uplotChart(sdk, chart)
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "300px"
  document.body.appendChild(element)
  instance.mount(element)
  await Promise.resolve()
  await Promise.resolve()

  return {
    chart,
    instance,
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

describe("uplot point overlay", () => {
  it("is registered in the overlay orchestration types", () => {
    expect(typeof types.point).toBe("function")
  })

  it("draws a crosshair without throwing for an in-view row and emits no area", async () => {
    const { instance, teardown } = await mountUplot({ "point-1": { type: "point", row: 1 } })

    const u = instance.getUPlot()
    const strokeSpy = jest.spyOn(u.ctx, "stroke")

    let called = false
    instance.on("overlayedAreaChanged:point-1", () => (called = true))

    expect(() => point(instance, "point-1")).not.toThrow()
    await nextFrame()

    expect(strokeSpy).toHaveBeenCalled()
    expect(called).toBe(false)

    strokeSpy.mockRestore()
    teardown()
  })

  it("does not throw when the row is out of range", async () => {
    const { instance, teardown } = await mountUplot({ "point-1": { type: "point", row: 999 } })

    expect(() => point(instance, "point-1")).not.toThrow()

    teardown()
  })
})
