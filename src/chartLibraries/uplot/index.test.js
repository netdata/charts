import React from "react"
import { render } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import { Flex, DefaultTheme } from "@netdata/netdata-ui"
import { makeTestChart, loadHeatmapPayload } from "@jest/testUtilities"
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

describe("uplotChart heatmap", () => {
  const heatmapIds = ["0", "1", "2", "3", "4", "5", "6"]
  const heatmapRows = [
    [0, 0, 1, 0, 2, 0, 0],
    [0, 0, 0, 3, 1, 0, 0],
    [0, 0, 2, 0, 0, 0, 0],
  ]

  const mountHeatmap = async (extraAttributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "heatmap",
        context: "prometheus.test.histogram",
        groupBy: ["dimension"],
        selectedLegendDimensions: [],
        viewDimensions: {
          ids: heatmapIds,
          names: heatmapIds,
          priorities: heatmapIds.map((_, index) => index),
          units: heatmapIds.map(() => ""),
          contexts: heatmapIds.map(() => ""),
          grouped: ["dimension"],
        },
        ...extraAttributes,
      },
    })

    await loadHeatmapPayload(chart, heatmapIds, heatmapRows, { timestamp: 1617946860000 })
    chart.getDateWindow = () => [1617946860000, 1617947750000]
    chart.formatXAxis = x => x.toString()
    chart.getThemeAttribute = () => "#333"

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    Object.defineProperty(element, "offsetWidth", { configurable: true, value: 800 })
    Object.defineProperty(element, "offsetHeight", { configurable: true, value: 300 })
    document.body.appendChild(element)

    return { sdk, chart, instance, element }
  }

  const cleanup = (instance, element) => {
    instance.unmount()
    document.body.removeChild(element)
  }

  it("takes the heatmap render path with null series paths for chartType heatmap", async () => {
    const { chart, instance, element } = await mountHeatmap()

    expect(chart.getAttribute("chartType")).toBe("heatmap")

    instance.mount(element)
    const u = instance.getUPlot()

    expect(element.querySelector(".uplot")).not.toBeNull()
    expect(u.series[1].paths()).toBeNull()
    expect(() => u.hooks.draw.forEach(hook => hook(u))).not.toThrow()

    cleanup(instance, element)
  })

  it("sets the y value-range to [0, numBuckets] using visible heatmap ids", async () => {
    const { chart, instance, element } = await mountHeatmap()

    instance.mount(element)
    const u = instance.getUPlot()

    const numBuckets = chart.getVisibleHeatmapIds().length
    expect(numBuckets).toBe(5)
    expect(u.scales.y.range(u, 0, 100)).toEqual([0, numBuckets])

    cleanup(instance, element)
  })

  it("exercises the shared heatmap accessors while rendering", async () => {
    const { chart, instance, element } = await mountHeatmap()

    const visibleSpy = jest.spyOn(chart, "getVisibleHeatmapIds")
    const yIndexSpy = jest.spyOn(chart, "getHeatmapYIndex")
    const scaleSpy = jest.spyOn(chart, "getHeatmapScale")
    const valueSpy = jest.spyOn(chart, "getDimensionValue")

    instance.mount(element)
    const u = instance.getUPlot()

    u.hooks.draw.forEach(hook => hook(u))
    u.axes[1].values(u, u.axes[1].splits(u, 1, 0, chart.getVisibleHeatmapIds().length))

    expect(visibleSpy).toHaveBeenCalled()
    expect(yIndexSpy).toHaveBeenCalled()
    expect(scaleSpy).toHaveBeenCalled()
    expect(valueSpy).toHaveBeenCalledWith(expect.any(String), expect.any(Number), {
      allowNull: true,
    })

    visibleSpy.mockRestore()
    yIndexSpy.mockRestore()
    scaleSpy.mockRestore()
    valueSpy.mockRestore()

    cleanup(instance, element)
  })

  it("labels the y-axis with bucket boundaries decimated to fit", async () => {
    const { chart, instance, element } = await mountHeatmap()

    instance.mount(element)
    const u = instance.getUPlot()

    const numBuckets = chart.getVisibleHeatmapIds().length
    const splits = u.axes[1].splits(u, 1, 0, numBuckets)

    expect(splits.length).toBeGreaterThan(0)
    splits.forEach(split => {
      expect(Number.isInteger(split)).toBe(true)
      expect(split).toBeGreaterThanOrEqual(0)
      expect(split).toBeLessThan(numBuckets)
    })

    const values = u.axes[1].values(u, splits)
    expect(values).toHaveLength(splits.length)
    values.forEach(value => expect(typeof value).toBe("string"))

    cleanup(instance, element)
  })
})

describe("uplotChart bars", () => {
  const positiveData = [
    [1617946860000, 10, 20, 30],
    [1617946865000, 12, 18, 28],
    [1617946870000, 11, 22, 31],
  ]

  const negativeData = [
    [1617946860000, 10, -20, 5],
    [1617946865000, -12, 18, -8],
    [1617946870000, 11, -22, 6],
  ]

  const withBarPayload = (chart, data) => {
    chart.getPayload = () => ({
      data,
      labels: ["time", "reads", "writes", "other"],
    })
    chart.getPayloadDimensionIds = () => ["reads", "writes", "other"]
    chart.getVisibleDimensionIds = () => ["reads", "writes", "other"]
    chart.isDimensionVisible = () => true
    chart.selectDimensionColor = () => "#3366CC"
    chart.getThemeAttribute = () => "#E4E8E8"
    chart.getConvertedValueWithUnit = value => `${value}`
  }

  const mountBars = (chartType, data) => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType } })
    withBarPayload(chart, data)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    return { sdk, chart, instance, element }
  }

  const cleanup = (instance, element) => {
    instance.unmount()
    document.body.removeChild(element)
  }

  it.each(["multiBar", "stackedBar"])(
    "draws %s on the main time-x instance, not a separate ordinal instance",
    chartType => {
      const { instance, element } = mountBars(chartType, positiveData)
      const u = instance.getUPlot()

      expect(element.querySelector(".uplot")).not.toBeNull()
      expect(u.scales.x.time).toBe(true)
      expect(u.scales.x.distr).not.toBe(2)
      expect(u.series[1].paths()).toBeNull()
      expect(() => u.hooks.draw.forEach(hook => hook(u))).not.toThrow()

      cleanup(instance, element)
    }
  )

  it.each(["multiBar", "stackedBar"])(
    "keeps the time x-range aligned with the chart date window for %s",
    chartType => {
      const { chart, instance, element } = mountBars(chartType, positiveData)
      const u = instance.getUPlot()

      const [after, before] = chart.getDateWindow()
      expect(u.scales.x.range()).toEqual([after / 1000, before / 1000])

      cleanup(instance, element)
    }
  )

  it("spans the multiBar y-range from the zero baseline to the tallest bar", () => {
    const { instance, element } = mountBars("multiBar", positiveData)
    const u = instance.getUPlot()

    const [min, max] = u.scales.y.range(u, 10, 31)
    expect(min).toBe(0)
    expect(max).toBeGreaterThanOrEqual(31)

    cleanup(instance, element)
  })

  it("includes negative values below the zero line in the multiBar y-range", () => {
    const { instance, element } = mountBars("multiBar", negativeData)
    const u = instance.getUPlot()

    const [min, max] = u.scales.y.range(u, -22, 18)
    expect(min).toBeLessThan(0)
    expect(max).toBeGreaterThan(0)

    cleanup(instance, element)
  })

  it("stacks stackedBar dimensions cumulatively via stack.js", () => {
    const { instance, element } = mountBars("stackedBar", positiveData)
    const u = instance.getUPlot()

    const [min, max] = u.scales.y.range(u, 10, 31)
    expect(min).toBe(0)
    expect(max).toBeGreaterThanOrEqual(60)

    cleanup(instance, element)
  })

  it("includes a negative cumulative total below the zero line in the stackedBar y-range", () => {
    const { instance, element } = mountBars("stackedBar", negativeData)
    const u = instance.getUPlot()

    const [min] = u.scales.y.range(u, -22, 18)
    expect(min).toBeLessThan(0)

    cleanup(instance, element)
  })

  it.each(["multiBar", "stackedBar"])(
    "emits hoverChart and highlightHover through the shared setCursor for %s",
    chartType => {
      const { sdk, instance, element } = mountBars(chartType, positiveData)

      const hovered = []
      const hoverCharts = []
      sdk.on("highlightHover", (c, x) => hovered.push(x))
      sdk.on("hoverChart", () => hoverCharts.push(true))

      instance.getUPlot().setCursor({ left: 400, top: 100 }, true)
      expect(hovered.length).toBeGreaterThan(0)
      expect(hovered[0]).toBeGreaterThanOrEqual(1617946860000)
      expect(hovered[0]).toBeLessThanOrEqual(1617946870000)
      expect(hoverCharts.length).toBeGreaterThan(0)

      cleanup(instance, element)
    }
  )
})
