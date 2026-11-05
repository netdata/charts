import { makeTestChart } from "@jest/testUtilities"
import gaugeChart from "./index"

const THRESHOLDS = [
  { id: "a", from: 0, color: ["#00AB44", "#00AB44"] },
  { id: "b", from: 80, color: ["#FFCC26", "#FFCC26"] },
  { id: "c", from: 90, color: ["#F95251", "#F95251"] },
]

const setup = (attributes = {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: { loaded: true, getValueRange: () => [0, 100], ...attributes },
  })
  chart.getPayload = () => ({ data: [[1617946860000, 85]] })
  chart.getClosestRow = () => 0
  chart.selectDimensionColor = () => "#00AB44"
  const instance = gaugeChart(sdk, chart)
  const element = document.createElement("div")
  const canvas = document.createElement("canvas")
  canvas.width = 200
  canvas.height = 200
  element.appendChild(canvas)
  return { sdk, chart, instance, element }
}

describe("gauge thresholds wiring (real engine)", () => {
  it("defaults gaugeThresholds to null", () => {
    const { chart } = setup()
    expect(chart.getAttribute("gaugeThresholds")).toBeNull()
  })

  it("mounts and renders with thresholds without throwing", () => {
    const { instance, element } = setup({ gaugeThresholds: THRESHOLDS })
    instance.mount(element)
    expect(() => instance.render()).not.toThrow()
  })

  it("re-renders after thresholds change at runtime without throwing", () => {
    const { chart, instance, element } = setup({ gaugeThresholds: THRESHOLDS })
    instance.mount(element)
    expect(() => chart.updateAttribute("gaugeThresholds", null)).not.toThrow()
    expect(() => instance.render()).not.toThrow()
  })
})
