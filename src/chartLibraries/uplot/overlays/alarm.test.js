import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "../index"
import alarm from "./alarm"

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

describe("uplot alarm overlay", () => {
  it("emits overlayedAreaChanged with a positioned area when the alarm is in view", async () => {
    const { instance, teardown } = await mountUplot({
      "alarm-1": { type: "alarm", when: after + 60, status: "critical", value: 42 },
    })

    let area
    instance.on("overlayedAreaChanged:alarm-1", next => (area = next))

    alarm(instance, "alarm-1")
    await nextFrame()

    expect(area).toEqual({
      from: expect.any(Number),
      to: expect.any(Number),
      width: expect.any(Number),
    })
    expect(Number.isFinite(area.from)).toBe(true)

    teardown()
  })

  it("emits a null area when the alarm falls outside the visible window", async () => {
    const { instance, teardown } = await mountUplot({
      "alarm-1": { type: "alarm", when: after - 5000, status: "warning", value: 1 },
    })

    let called = false
    let area = "unset"
    instance.on("overlayedAreaChanged:alarm-1", next => {
      called = true
      area = next
    })

    alarm(instance, "alarm-1")
    await nextFrame()

    expect(called).toBe(true)
    expect(area).toBeUndefined()

    teardown()
  })
})
