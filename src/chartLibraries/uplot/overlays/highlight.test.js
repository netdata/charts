import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import highlight from "./highlight"

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

describe("uplot highlight overlay", () => {
  it("emits a positioned {from,to,width} area for a selection within the window", async () => {
    const { instance, teardown } = await mountUplot({
      highlight: { type: "highlight", range: [after + 60, after + 300] },
    })

    let area
    instance.on("overlayedAreaChanged:highlight", next => (area = next))

    highlight(instance, "highlight")
    await nextFrame()

    expect(area).toEqual({
      from: expect.any(Number),
      to: expect.any(Number),
      width: expect.any(Number),
    })
    expect(area.width).toBeGreaterThan(0)

    teardown()
  })

  it("emits a null area when the selection is out of the visible window", async () => {
    const { instance, teardown } = await mountUplot({
      highlight: { type: "highlight", range: [after - 9000, after - 8000] },
    })

    let called = false
    let area = "unset"
    instance.on("overlayedAreaChanged:highlight", next => {
      called = true
      area = next
    })

    highlight(instance, "highlight")
    await nextFrame()

    expect(called).toBe(true)
    expect(area).toBeUndefined()

    teardown()
  })

  it("does not emit or throw when the range is missing", async () => {
    const { instance, teardown } = await mountUplot({
      highlight: { type: "highlight" },
    })

    let called = false
    instance.on("overlayedAreaChanged:highlight", () => (called = true))

    expect(() => highlight(instance, "highlight")).not.toThrow()
    await nextFrame()

    expect(called).toBe(false)

    teardown()
  })
})
