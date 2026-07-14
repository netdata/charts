import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "./index"

const withLoadedPayload = chart => {
  chart.getPayload = () => ({
    data: [
      [1617946860000, 10, 20, 30],
      [1617946865000, 12, 18, 28],
      [1617946870000, 11, 22, 31],
    ],
    labels: ["time", "load1", "load5", "load15", "ANOMALY_RATE", "ANNOTATIONS"],
  })
  chart.getPayloadDimensionIds = () => ["load1", "load5", "load15"]
  chart.getVisibleDimensionIds = () => ["load1", "load5", "load15"]
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#E4E8E8"
  chart.getConvertedValueWithUnit = value => `${value}`
}

describe("uplotChart", () => {
  it("creates a chart instance exposing the lifecycle contract", () => {
    const { sdk, chart } = makeTestChart()

    const instance = uplotChart(sdk, chart)

    expect(typeof instance.mount).toBe("function")
    expect(typeof instance.unmount).toBe("function")
    expect(typeof instance.render).toBe("function")
  })

  it("mounts without a uPlot instance when there is no data", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: false } })
    chart.getPayload = () => ({ data: [] })
    chart.getPayloadDimensionIds = () => []

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")

    expect(() => instance.mount(element)).not.toThrow()
    expect(element.querySelector(".uplot")).toBeNull()
  })

  it("renders a real uPlot chart when data is available", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)

    expect(() => instance.mount(element)).not.toThrow()
    expect(element.querySelector(".uplot")).not.toBeNull()

    document.body.removeChild(element)
  })

  it("emits highlightHover and highlightBlur on the sdk bus as the cursor moves", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const hovered = []
    const blurred = []
    sdk.on("highlightHover", (c, x) => hovered.push(x))
    sdk.on("highlightBlur", () => blurred.push(true))

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().setCursor({ left: 400, top: 100 }, true)
    expect(hovered.length).toBeGreaterThan(0)
    expect(hovered[0]).toBeGreaterThanOrEqual(1617946860000)
    expect(hovered[0]).toBeLessThanOrEqual(1617946870000)

    instance.getUPlot().setCursor({ left: -10, top: -10 }, true)
    expect(blurred.length).toBeGreaterThan(0)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("redraws a crosshair when hoverX changes without throwing", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    expect(() => chart.updateAttribute("hoverX", [1617946865000])).not.toThrow()
    expect(() => chart.updateAttribute("hoverX", null)).not.toThrow()

    instance.unmount()
    document.body.removeChild(element)
  })

  it("unmounts and destroys the uPlot instance cleanly", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)

    instance.mount(element)
    expect(() => instance.unmount()).not.toThrow()
    expect(element.querySelector(".uplot")).toBeNull()

    document.body.removeChild(element)
  })
})
