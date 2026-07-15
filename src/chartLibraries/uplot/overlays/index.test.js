import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import makeOverlays from "./index"

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

  return { chart, instance, teardown: () => (instance.unmount(), document.body.removeChild(element)) }
}

describe("uplot overlays orchestration", () => {
  it("exposes toggle, destroy and draw", () => {
    const { sdk, chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })
    const overlays = makeOverlays(uplotChart(sdk, chart))

    expect(typeof overlays.toggle).toBe("function")
    expect(typeof overlays.destroy).toBe("function")
    expect(typeof overlays.draw).toBe("function")
  })

  it("draws overlays through the uPlot draw hook and emits positions", async () => {
    const { instance, teardown } = await mountUplot({
      "alarm-1": { type: "alarm", when: after + 60, status: "critical", value: 42 },
    })

    let area
    instance.on("overlayedAreaChanged:alarm-1", next => (area = next))

    instance.getUPlot().redraw()
    await nextFrame()

    expect(area).toEqual({
      from: expect.any(Number),
      to: expect.any(Number),
      width: expect.any(Number),
    })

    teardown()
  })

  it("redraws and emits when the overlays attribute changes", async () => {
    const { chart, instance, teardown } = await mountUplot({})

    let area = "unset"
    instance.on("overlayedAreaChanged:alarm-late", next => (area = next))

    chart.updateAttribute("overlays", {
      "alarm-late": { type: "alarm", when: after + 120, status: "warning", value: 7 },
    })
    await nextFrame()

    expect(area).toEqual({
      from: expect.any(Number),
      to: expect.any(Number),
      width: expect.any(Number),
    })

    teardown()
  })

  it("does not throw drawing an empty overlays map", async () => {
    const { instance, teardown } = await mountUplot({})

    expect(() => instance.getUPlot().redraw()).not.toThrow()

    teardown()
  })

  it("ignores overlay ids whose type has no renderer", async () => {
    const { instance, teardown } = await mountUplot({
      unknown: { type: "does-not-exist" },
    })

    expect(() => instance.getUPlot().redraw()).not.toThrow()

    teardown()
  })
})
