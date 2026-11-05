import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import types from "./types"
import annotation from "./annotation"

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

const mountUplot = async attributes => {
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

describe("uplot annotation overlay", () => {
  it("is registered in the overlay orchestration types", () => {
    expect(typeof types.annotation).toBe("function")
  })

  it("emits overlayedAreaChanged with a positioned area for an in-view annotation", async () => {
    const { instance, teardown } = await mountUplot({
      overlays: { "ann-1": { type: "annotation", timestamp: after + 60, color: "#ff0000" } },
    })

    let area
    instance.on("overlayedAreaChanged:ann-1", next => (area = next))

    annotation(instance, "ann-1")
    await nextFrame()

    expect(area).toEqual({
      from: expect.any(Number),
      to: expect.any(Number),
      width: expect.any(Number),
    })
    expect(Number.isFinite(area.from)).toBe(true)

    teardown()
  })

  it("emits a null area when the annotation falls outside the visible window", async () => {
    const { instance, teardown } = await mountUplot({
      overlays: { "ann-1": { type: "annotation", timestamp: after - 5000, color: "#ff0000" } },
    })

    let called = false
    let area = "unset"
    instance.on("overlayedAreaChanged:ann-1", next => {
      called = true
      area = next
    })

    annotation(instance, "ann-1")
    await nextFrame()

    expect(called).toBe(true)
    expect(area).toBeUndefined()

    teardown()
  })

  it("draws a dashed draft marker and emits a zero-width area for draftAnnotation", async () => {
    const { chart, instance, teardown } = await mountUplot({})
    chart.updateAttribute("draftAnnotation", { timestamp: after + 60, status: "draft" })

    const u = instance.getUPlot()
    const strokeSpy = jest.spyOn(u.ctx, "stroke")

    let area
    instance.on("overlayedAreaChanged:draftAnnotation", next => (area = next))

    annotation(instance, "draftAnnotation")
    await nextFrame()

    expect(strokeSpy).toHaveBeenCalled()
    expect(area).toEqual({ from: expect.any(Number), to: expect.any(Number), width: 0 })

    strokeSpy.mockRestore()
    teardown()
  })

  it("ignores overlays whose type is not annotation", async () => {
    const { instance, teardown } = await mountUplot({
      overlays: { "x-1": { type: "point", timestamp: after + 60 } },
    })

    let called = false
    instance.on("overlayedAreaChanged:x-1", () => (called = true))

    annotation(instance, "x-1")
    await nextFrame()

    expect(called).toBe(false)

    teardown()
  })
})
