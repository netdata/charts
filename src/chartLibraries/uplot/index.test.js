import React from "react"
import { render } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme } from "@netdata/netdata-ui"
import { makeTestChart } from "@jest/testUtilities"
import ChartContainer from "@/components/chartContainer"
import withChart from "@/components/hocs/withChart"
import makeMockPayload from "@/helpers/makeMockPayload"
import makeDefaultSDK from "../../makeDefaultSDK"
import systemLoadLine from "../../../fixtures/systemLoadLine"
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

  it("configures date-window x-range, value y-range, and formatted x-axis labels", () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        after: 1617946860,
        before: 1617947760,
        staticValueRange: [5, 40],
      },
    })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    const u = instance.getUPlot()
    expect(u.scales.x.range()).toEqual([1617946860, 1617947760])
    expect(u.scales.y.range(u, 0, 100)).toEqual([5, 40])

    const labels = u.axes[0].values(u, [1617946860])
    expect(labels).toHaveLength(1)
    expect(typeof labels[0]).toBe("string")

    instance.unmount()
    document.body.removeChild(element)
  })

  it("does not emit hover events when enabledHover is false", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", enabledHover: false },
    })
    withLoadedPayload(chart)

    const hovered = []
    sdk.on("highlightHover", (c, x) => hovered.push(x))

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().setCursor({ left: 400, top: 100 }, true)
    expect(hovered).toHaveLength(0)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("clears the uPlot instance when data goes out of limits", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    expect(instance.getUPlot()).not.toBeNull()

    chart.updateAttribute("outOfLimits", true)
    instance.render()
    expect(instance.getUPlot()).toBeNull()

    instance.unmount()
    document.body.removeChild(element)
  })

  it("reacts to staticValueRange, timezone and units changes without throwing", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    expect(() => chart.updateAttribute("staticValueRange", [1, 9])).not.toThrow()
    expect(() => chart.updateAttribute("timezone", "Asia/Tokyo")).not.toThrow()
    expect(() => chart.updateAttribute("unitsConversionPrefix", "milli")).not.toThrow()

    instance.unmount()
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

  it("mounts through ChartContainer via the SDK provider path without throwing", () => {
    const sdk = makeDefaultSDK()
    sdk.addUI("uplot", uplotChart)
    const chart = sdk.makeChart({
      getChart: makeMockPayload(systemLoadLine[0], { delay: 0 }),
      attributes: { contextScope: ["system.load"], chartLibrary: "uplot", chartType: "line" },
    })
    sdk.appendChild(chart)

    const UplotChart = withChart(({ uiName }) => <ChartContainer uiName={uiName} />)

    expect(() =>
      render(
        <ThemeProvider theme={DefaultTheme}>
          <Flex width="800px" height="300px">
            <UplotChart chart={chart} />
          </Flex>
        </ThemeProvider>
      )
    ).not.toThrow()
  })

  it("hides axes in sparkline mode", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", sparkline: true },
    })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "200px"
    element.style.height = "40px"
    document.body.appendChild(element)
    instance.mount(element)

    const u = instance.getUPlot()
    expect(u.axes[0].show).toBe(false)
    expect(u.axes[1].show).toBe(false)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("reports plot-area dimensions once mounted", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    expect(typeof instance.getChartWidth()).toBe("number")

    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    expect(typeof instance.getChartWidth()).toBe("number")
    expect(typeof instance.getChartHeight()).toBe("number")

    instance.unmount()
    document.body.removeChild(element)
  })

  it("renders the stacked type with a null series path and a diverging fill draw hook", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "stacked" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)

    expect(() => instance.mount(element)).not.toThrow()

    const u = instance.getUPlot()
    expect(element.querySelector(".uplot")).not.toBeNull()
    expect(u.series[1].paths()).toBeNull()
    expect(() => u.redraw()).not.toThrow()

    instance.unmount()
    document.body.removeChild(element)
  })

  it("does not create an orphaned uPlot when render runs before mount", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)

    instance.render()
    expect(instance.getUPlot()).toBeNull()

    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    const u = instance.getUPlot()
    expect(u).not.toBeNull()
    expect(u.root.isConnected).toBe(true)
    expect(element.querySelector(".uplot")).not.toBeNull()

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

  it.each(["multiBar", "stackedBar"])(
    "renders %s via the seriesBars plugin without throwing",
    chartType => {
      const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType } })
      withLoadedPayload(chart)

      const instance = uplotChart(sdk, chart)
      const element = document.createElement("div")
      element.style.width = "800px"
      element.style.height = "300px"
      document.body.appendChild(element)

      expect(() => instance.mount(element)).not.toThrow()
      expect(element.querySelector(".uplot")).not.toBeNull()

      instance.unmount()
      document.body.removeChild(element)
    }
  )

  it("emits highlightEnd on drag-select in select mode", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", navigation: "select" },
    })
    withLoadedPayload(chart)

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().setSelect({ left: 100, top: 0, width: 200, height: 0 }, true)
    expect(ends).toHaveLength(1)
    expect(ends[0]).toHaveLength(2)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("does not emit highlightEnd when navigation is pan", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", navigation: "pan" },
    })
    withLoadedPayload(chart)

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().setSelect({ left: 100, top: 0, width: 200, height: 0 }, true)
    expect(ends).toHaveLength(0)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("resets navigation on double-click", () => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", navigation: "pan" },
    })
    withLoadedPayload(chart)

    const spy = jest.spyOn(chart, "resetNavigation")

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().over.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }))
    expect(spy).toHaveBeenCalled()

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
