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

    const yRange = u.scales.y.range(u, 0, 100)
    expect(yRange[0]).toBeLessThan(5)
    expect(yRange[1]).toBeGreaterThan(40)

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

  it("keeps a framed empty chart when data goes out of limits and recovers when valid data returns", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    const full = instance.getUPlot()
    expect(full).not.toBeNull()
    expect(full.series).toHaveLength(4)

    chart.updateAttribute("outOfLimits", true)
    expect(() => instance.render()).not.toThrow()

    const framed = instance.getUPlot()
    expect(framed).not.toBeNull()
    expect(element.querySelector(".uplot")).not.toBeNull()
    expect(framed.axes[0].show).toBe(true)
    expect(framed.axes[1].show).toBe(true)
    expect(framed.series).toHaveLength(1)

    chart.updateAttribute("outOfLimits", false)
    expect(() => instance.render()).not.toThrow()

    const recovered = instance.getUPlot()
    expect(recovered).not.toBeNull()
    expect(recovered.series).toHaveLength(4)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("mounts a framed empty chart when the payload has no dimensions, without throwing", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    chart.getPayload = () => ({ data: [], labels: ["time"] })
    chart.getPayloadDimensionIds = () => []
    chart.getVisibleDimensionIds = () => []
    chart.isDimensionVisible = () => true
    chart.selectDimensionColor = () => "#3366CC"
    chart.getThemeAttribute = () => "#E4E8E8"
    chart.getConvertedValueWithUnit = value => `${value}`

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)

    expect(() => instance.mount(element)).not.toThrow()

    const u = instance.getUPlot()
    expect(u).not.toBeNull()
    expect(element.querySelector(".uplot")).not.toBeNull()
    expect(u.axes[0].show).toBe(true)
    expect(u.axes[1].show).toBe(true)
    expect(u.series).toHaveLength(1)

    instance.unmount()
    document.body.removeChild(element)
  })

  it("renders nothing until loaded, then draws the framed empty chart once loaded", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: false, chartType: "line" } })
    chart.getPayload = () => ({ data: [], labels: ["time"] })
    chart.getPayloadDimensionIds = () => []
    chart.getVisibleDimensionIds = () => []
    chart.isDimensionVisible = () => true
    chart.selectDimensionColor = () => "#3366CC"
    chart.getThemeAttribute = () => "#E4E8E8"
    chart.getConvertedValueWithUnit = value => `${value}`

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)

    instance.mount(element)
    expect(instance.getUPlot()).toBeNull()
    expect(element.querySelector(".uplot")).toBeNull()

    chart.updateAttribute("loaded", true)

    expect(instance.getUPlot()).not.toBeNull()
    expect(element.querySelector(".uplot")).not.toBeNull()

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

  it("emits highlightHover and highlightBlur on the chart bus too, with the nearest dimension", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const chartHovered = []
    const chartBlurred = []
    chart.on("highlightHover", (x, dimensionId) => chartHovered.push([x, dimensionId]))
    chart.on("highlightBlur", () => chartBlurred.push(true))

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    instance.getUPlot().setCursor({ left: 400, top: 100 }, true)
    expect(chartHovered.length).toBeGreaterThan(0)
    expect(["load1", "load5", "load15"]).toContain(chartHovered[0][1])

    instance.getUPlot().setCursor({ left: -10, top: -10 }, true)
    expect(chartBlurred.length).toBeGreaterThan(0)

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

describe("uplotChart click-to-annotate", () => {
  const withLoadedClickPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
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

  const mount = async (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        after: 1617946860,
        before: 1617946870,
        ...attributes,
      },
    })
    withLoadedClickPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    u.over.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
      right: 800,
      bottom: 300,
    })

    const click = clientX => {
      u.over.dispatchEvent(new MouseEvent("mousedown", { clientX, clientY: 100, button: 0 }))
      document.dispatchEvent(new MouseEvent("mouseup", { clientX, clientY: 100 }))
    }

    const dragClick = (fromX, toX) => {
      u.over.dispatchEvent(new MouseEvent("mousedown", { clientX: fromX, clientY: 100, button: 0 }))
      document.dispatchEvent(new MouseEvent("mousemove", { clientX: toX, clientY: 100 }))
      document.dispatchEvent(new MouseEvent("mouseup", { clientX: toX, clientY: 100 }))
    }

    return {
      sdk,
      chart,
      instance,
      u,
      click,
      dragClick,
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("sets a draft annotation and fires annotationCreate on a plain click", async () => {
    const { sdk, chart, click, teardown } = await mount({ navigation: "select" })

    const created = []
    sdk.on("annotationCreate", (c, ts) => created.push(ts))

    click(400)

    const draft = chart.getAttribute("draftAnnotation")
    expect(draft).toBeTruthy()
    expect(draft.status).toBe("draft")
    expect(typeof draft.timestamp).toBe("number")
    expect(created.length).toBe(1)

    teardown()
  })

  it("fires highlightClick on the sdk bus on a plain click", async () => {
    const { sdk, click, teardown } = await mount({ navigation: "select" })

    const clicks = []
    sdk.on("highlightClick", (c, ts) => clicks.push(ts))

    click(400)

    expect(clicks.length).toBe(1)
    expect(clicks[0]).toBeGreaterThanOrEqual(1617946860000)
    expect(clicks[0]).toBeLessThanOrEqual(1617946870000)

    teardown()
  })

  it("does not annotate when the click follows a drag", async () => {
    const { chart, dragClick, teardown } = await mount({ navigation: "select" })

    dragClick(100, 300)

    expect(chart.getAttribute("draftAnnotation")).toBeFalsy()

    teardown()
  })

  it("does not annotate when enabledHover is false", async () => {
    const { chart, click, teardown } = await mount({ navigation: "select", enabledHover: false })

    click(400)

    expect(chart.getAttribute("draftAnnotation")).toBeFalsy()

    teardown()
  })

  it("does not create a draft when the click lands on an existing annotation", async () => {
    const { chart, u, click, teardown } = await mount({
      navigation: "select",
      overlays: { "ann-1": { type: "annotation", timestamp: 1617946865 } },
    })

    click(u.valToPos(1617946865, "x"))

    expect(chart.getAttribute("draftAnnotation")).toBeFalsy()

    teardown()
  })

  it("does not annotate during a pan gesture, matching dygraph hover suppression", async () => {
    const { chart, click, teardown } = await mount({ navigation: "pan" })

    click(400)

    expect(chart.getAttribute("draftAnnotation")).toBeFalsy()

    teardown()
  })
})

describe("uplotChart touch navigation", () => {
  const withTouchPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
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

  const touchEvent = (type, x) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    const touch = { clientX: x, clientY: 100, pageX: x, pageY: 100 }
    event.touches = type === "touchend" ? [] : [touch]
    event.changedTouches = [touch]
    return event
  }

  const mount = async (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        after: 1617946860,
        before: 1617946870,
        ...attributes,
      },
    })
    withTouchPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    u.over.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
      right: 800,
      bottom: 300,
    })

    return {
      sdk,
      chart,
      instance,
      u,
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("pans the x-scale on a single-finger drag, emitting panStart and panEnd", async () => {
    const { sdk, u, teardown } = await mount()

    let panStarts = 0
    let panEnds = 0
    sdk.on("panStart", () => panStarts++)
    sdk.on("panEnd", () => panEnds++)

    const setScaleSpy = jest.spyOn(u, "setScale")

    u.over.dispatchEvent(touchEvent("touchstart", 400))
    u.over.dispatchEvent(touchEvent("touchmove", 300))

    expect(panStarts).toBe(1)
    expect(setScaleSpy).toHaveBeenCalledWith(
      "x",
      expect.objectContaining({ min: expect.any(Number), max: expect.any(Number) })
    )

    u.over.dispatchEvent(touchEvent("touchend", 300))
    expect(panEnds).toBe(1)

    setScaleSpy.mockRestore()
    teardown()
  })

  it("sets clickX to the tapped timestamp on a tap with no movement", async () => {
    const { chart, u, teardown } = await mount()

    u.over.dispatchEvent(touchEvent("touchstart", 400))
    u.over.dispatchEvent(touchEvent("touchend", 400))

    const clickX = chart.getAttribute("clickX")
    expect(Array.isArray(clickX)).toBe(true)
    expect(clickX[0]).toBeGreaterThanOrEqual(1617946860000)
    expect(clickX[0]).toBeLessThanOrEqual(1617946870000)
    expect(clickX[1]).toBeNull()

    teardown()
  })

  it("resets navigation on a double-tap within the double-tap delay", async () => {
    const { chart, u, teardown } = await mount()

    const resetSpy = jest.spyOn(chart, "resetNavigation")

    u.over.dispatchEvent(touchEvent("touchstart", 400))
    u.over.dispatchEvent(touchEvent("touchend", 400))
    u.over.dispatchEvent(touchEvent("touchstart", 400))
    u.over.dispatchEvent(touchEvent("touchend", 400))

    expect(resetSpy).toHaveBeenCalled()

    resetSpy.mockRestore()
    teardown()
  })

  it("does not handle touch when navigation is disabled", async () => {
    const { chart, u, teardown } = await mount({ enabledNavigation: false })

    u.over.dispatchEvent(touchEvent("touchstart", 400))
    u.over.dispatchEvent(touchEvent("touchend", 400))

    expect(chart.getAttribute("clickX")).toBeFalsy()

    teardown()
  })
})

describe("uplotChart stacked gap handling", () => {
  const withStackedPayload = (chart, data) => {
    chart.getPayload = () => ({ data, labels: ["time", "a", "b"] })
    chart.getPayloadDimensionIds = () => ["a", "b"]
    chart.getVisibleDimensionIds = () => ["a", "b"]
    chart.isDimensionVisible = () => true
    chart.selectDimensionColor = () => "#3366CC"
    chart.getThemeAttribute = () => "#E4E8E8"
    chart.getConvertedValueWithUnit = value => `${value}`
  }

  const mountStacked = async data => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "stacked",
        chartLibrary: "uplot",
        after: 1617946860,
        before: 1617946870,
      },
    })
    withStackedPayload(chart, data)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    return { instance, teardown: () => (instance.unmount(), document.body.removeChild(element)) }
  }

  it("draws a stacked series containing null gaps without throwing", async () => {
    const { instance, teardown } = await mountStacked([
      [1617946860000, 10, 20],
      [1617946865000, 10, null],
      [1617946870000, 10, 20],
    ])
    const u = instance.getUPlot()

    expect(() => u.hooks.draw.forEach(hook => hook(u))).not.toThrow()

    teardown()
  })
})

describe("uplotChart wheel gating + drag threshold (dygraph parity)", () => {
  const withPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
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

  const mount = async (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        after: 1617946860,
        before: 1617947760,
        ...attributes,
      },
    })
    withPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    u.over.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
      right: 800,
      bottom: 300,
    })

    return {
      sdk,
      chart,
      instance,
      u,
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  const wheel = (u, extra) => {
    const event = new Event("wheel", { bubbles: true, cancelable: true })
    event.deltaY = -100
    Object.assign(event, extra)
    u.over.dispatchEvent(event)
  }

  it("ignores a plain wheel (dygraph gates zoom behind Shift/Alt)", async () => {
    const { u, teardown } = await mount()
    u.setCursor({ left: 400, top: 100 }, true)

    const spy = jest.spyOn(u, "setScale")
    wheel(u, {})
    expect(spy).not.toHaveBeenCalled()

    spy.mockRestore()
    teardown()
  })

  it("zooms on Shift+wheel", async () => {
    const { u, teardown } = await mount()
    u.setCursor({ left: 400, top: 100 }, true)

    const spy = jest.spyOn(u, "setScale")
    wheel(u, { shiftKey: true })
    expect(spy).toHaveBeenCalledWith("x", expect.objectContaining({ min: expect.any(Number) }))

    spy.mockRestore()
    teardown()
  })

  it("zooms on Alt+wheel", async () => {
    const { u, teardown } = await mount()
    u.setCursor({ left: 400, top: 100 }, true)

    const spy = jest.spyOn(u, "setScale")
    wheel(u, { altKey: true })
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
    teardown()
  })

  it("ends a sub-5px drag-select with a null range (dygraph parity, no zoom)", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    u.setSelect({ left: 100, top: 0, width: 3, height: 0 }, true)
    expect(ends).toHaveLength(1)
    expect(ends[0]).toBeNull()

    teardown()
  })

  it("emits highlightEnd for a >=5px drag-select", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    u.setSelect({ left: 100, top: 0, width: 50, height: 0 }, true)
    expect(ends).toHaveLength(1)

    teardown()
  })
})

describe("uplotChart mouse pan navigation", () => {
  const after = 1617946860
  const before = 1617947760

  const withPanPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [after * 1000, 10, 20, 30],
        [(after + 450) * 1000, 12, 18, 28],
        [before * 1000, 11, 22, 31],
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

  const mount = async () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        navigation: "pan",
        after,
        before,
      },
    })
    withPanPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    return {
      sdk,
      chart,
      instance,
      u: instance.getUPlot(),
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("shifts the live x-scale while dragging instead of snapping back to the window", async () => {
    const { u, teardown } = await mount()

    const min0 = u.scales.x.min

    u.over.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 400, clientY: 100 }))
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 100 }))
    await Promise.resolve()

    expect(u.scales.x.min).not.toBeCloseTo(min0, 5)

    document.dispatchEvent(new MouseEvent("mouseup", { clientX: 200, clientY: 100 }))
    teardown()
  })

  it("reports a moved window on panEnd so moveX is not a no-op", async () => {
    const { sdk, u, teardown } = await mount()

    const min0 = u.scales.x.min

    let panEndRange
    sdk.on("panEnd", (c, range) => (panEndRange = range))

    u.over.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 400, clientY: 100 }))
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 100 }))
    document.dispatchEvent(new MouseEvent("mouseup", { clientX: 200, clientY: 100 }))

    expect(panEndRange).toBeDefined()
    expect(panEndRange[0]).not.toBeCloseTo(min0 * 1000, 0)
    expect(panEndRange[0]).toBeGreaterThan(min0 * 1000)

    teardown()
  })

  it("hands the committed window back to getDateWindow after the drag ends", async () => {
    const { chart, u, teardown } = await mount()

    u.over.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 400, clientY: 100 }))
    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 200, clientY: 100 }))
    document.dispatchEvent(new MouseEvent("mouseup", { clientX: 200, clientY: 100 }))

    const [winAfter] = chart.getDateWindow()
    expect(winAfter).toBeGreaterThan(after * 1000)

    teardown()
  })
})

describe("uplotChart modifier-key navigation switching (dygraph parity)", () => {
  const withPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
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

  const mount = async (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        navigation: "pan",
        after: 1617946860,
        before: 1617947760,
        ...attributes,
      },
    })
    withPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    u.over.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
      right: 800,
      bottom: 300,
    })

    return {
      sdk,
      chart,
      instance,
      u,
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  const enter = u => u.over.dispatchEvent(new MouseEvent("mouseenter"))
  const leave = u => u.over.dispatchEvent(new MouseEvent("mouseleave"))
  const down = (u, mods = {}) =>
    u.over.dispatchEvent(
      new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 100, ...mods })
    )
  const up = (clientX = 100) =>
    document.dispatchEvent(new MouseEvent("mouseup", { button: 0, clientX, clientY: 100 }))
  const flushTimers = () => new Promise(resolve => setTimeout(resolve))

  it("switches to select on Shift+mousedown while the pointer is over the chart", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("select")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    up()
    await flushTimers()
    expect(chart.getAttribute("navigation")).toBe("pan")
    expect(chart.getAttribute("prevNavigation")).toBeNull()

    teardown()
  })

  it("switches to highlight on Alt+mousedown, restoring on mouseup", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { altKey: true })
    expect(chart.getAttribute("navigation")).toBe("highlight")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    up()
    await flushTimers()
    expect(chart.getAttribute("navigation")).toBe("pan")

    teardown()
  })

  it("switches to selectVertical on Shift+Alt+mousedown, restoring on mouseup", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { shiftKey: true, altKey: true })
    expect(chart.getAttribute("navigation")).toBe("selectVertical")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    up()
    await flushTimers()
    expect(chart.getAttribute("navigation")).toBe("pan")

    teardown()
  })

  it("captures the real base navigation in prevNavigation across a second switch", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("select")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    down(u, { shiftKey: true, altKey: true })
    expect(chart.getAttribute("navigation")).toBe("selectVertical")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    up()
    await flushTimers()
    expect(chart.getAttribute("navigation")).toBe("pan")

    teardown()
  })

  it("does not switch on a plain mousedown with no modifier", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u)
    expect(chart.getAttribute("navigation")).toBe("pan")
    expect(chart.getAttribute("prevNavigation")).toBeFalsy()

    up()
    teardown()
  })

  it("does not switch when the pointer is not over the chart", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)
    leave(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("pan")

    up()
    teardown()
  })

  it("does not switch when navigation is disabled", async () => {
    const { chart, u, teardown } = await mount({ enabledNavigation: false })
    enter(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("pan")

    up()
    teardown()
  })

  it("does not change navigation on keydown (no typing hijack)", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Shift", shiftKey: true }))
    expect(chart.getAttribute("navigation")).toBe("pan")
    expect(chart.getAttribute("prevNavigation")).toBeFalsy()

    document.dispatchEvent(new KeyboardEvent("keyup", { key: "Shift" }))
    expect(chart.getAttribute("navigation")).toBe("pan")

    teardown()
  })

  it("defers the mouseup restore past the end-plugin chain, leaving hover enabled", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("select")
    expect(chart.getAttribute("enabledHover")).toBe(false)
    expect(chart.getAttribute("highlighting")).toBe(true)

    document.dispatchEvent(new MouseEvent("mousemove", { clientX: 300, clientY: 100 }))
    u.setSelect({ left: 100, top: 0, width: 200, height: 0 }, true)
    expect(chart.getAttribute("enabledHover")).toBe(true)
    expect(chart.getAttribute("highlighting")).toBe(false)

    up(300)
    expect(chart.getAttribute("navigation")).toBe("select")

    await flushTimers()
    expect(chart.getAttribute("navigation")).toBe("pan")
    expect(chart.getAttribute("prevNavigation")).toBeNull()
    expect(chart.getAttribute("enabledHover")).toBe(true)
    expect(chart.getAttribute("highlighting")).toBe(false)

    teardown()
  })

  it("restores a stuck prevNavigation on window blur", async () => {
    const { chart, u, teardown } = await mount()
    enter(u)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("select")
    expect(chart.getAttribute("prevNavigation")).toBe("pan")

    window.dispatchEvent(new Event("blur"))
    expect(chart.getAttribute("navigation")).toBe("pan")
    expect(chart.getAttribute("prevNavigation")).toBeNull()

    teardown()
  })

  it("runs the capture-phase switch before uPlot's mousedown so the gesture selects", async () => {
    const { sdk, chart, u, teardown } = await mount()
    enter(u)

    const starts = []
    sdk.on("highlightStart", () => starts.push(true))

    down(u, { shiftKey: true })

    expect(chart.getAttribute("navigation")).toBe("select")
    expect(u.cursor.drag.x).toBe(true)
    expect(starts).toHaveLength(1)

    up()
    await flushTimers()
    teardown()
  })

  it("keeps the same uPlot instance while mutating cursor.drag in place on switch", async () => {
    const { chart, instance, u, teardown } = await mount()
    enter(u)

    expect(u.cursor.drag.x).toBe(false)
    expect(u.cursor.drag.y).toBe(false)

    down(u, { shiftKey: true })
    expect(chart.getAttribute("navigation")).toBe("select")
    expect(instance.getUPlot()).toBe(u)
    expect(u.cursor.drag.x).toBe(true)
    expect(u.cursor.drag.y).toBe(false)

    up()
    await flushTimers()

    down(u, { shiftKey: true, altKey: true })
    expect(chart.getAttribute("navigation")).toBe("selectVertical")
    expect(instance.getUPlot()).toBe(u)
    expect(u.cursor.drag.x).toBe(false)
    expect(u.cursor.drag.y).toBe(true)

    up()
    await flushTimers()
    teardown()
  })
})

describe("uplotChart select gesture start/end (dygraph parity)", () => {
  const withPayload = chart => {
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
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

  const mount = async (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "line",
        chartLibrary: "uplot",
        after: 1617946860,
        before: 1617947760,
        ...attributes,
      },
    })
    withPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    u.over.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 800,
      height: 300,
      right: 800,
      bottom: 300,
    })

    return {
      sdk,
      chart,
      instance,
      u,
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  const down = u =>
    u.over.dispatchEvent(new MouseEvent("mousedown", { button: 0, clientX: 100, clientY: 100 }))
  const up = clientX =>
    document.dispatchEvent(new MouseEvent("mouseup", { button: 0, clientX, clientY: 100 }))

  it("emits highlightStart on mousedown in select mode, before any mouseup", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const starts = []
    sdk.on("highlightStart", () => starts.push(true))

    down(u)
    expect(starts).toHaveLength(1)

    up(100)
    teardown()
  })

  it("emits highlightVerticalStart on mousedown in selectVertical mode", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "selectVertical" })

    const starts = []
    sdk.on("highlightVerticalStart", () => starts.push(true))

    down(u)
    expect(starts).toHaveLength(1)

    up(100)
    teardown()
  })

  it("does not emit highlightStart on mousedown in pan mode", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "pan" })

    const starts = []
    sdk.on("highlightStart", () => starts.push(true))

    down(u)
    expect(starts).toHaveLength(0)

    up(100)
    teardown()
  })

  it("emits highlightEnd with a numeric range for a >=5px setSelect", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    u.setSelect({ left: 100, top: 0, width: 200, height: 0 }, true)
    expect(ends).toHaveLength(1)
    expect(ends[0]).toHaveLength(2)
    expect(typeof ends[0][0]).toBe("number")

    teardown()
  })

  it("ends a pure click (mousedown+mouseup, no setSelect) with highlightEnd(null) exactly once", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    down(u)
    up(100)

    expect(ends).toHaveLength(1)
    expect(ends[0]).toBeNull()

    teardown()
  })

  it("fires highlightEnd exactly once when a real setSelect precedes the mouseup", async () => {
    const { sdk, u, teardown } = await mount({ navigation: "select" })

    const ends = []
    sdk.on("highlightEnd", (c, range) => ends.push(range))

    down(u)
    u.setSelect({ left: 100, top: 0, width: 200, height: 0 }, true)
    up(300)

    expect(ends).toHaveLength(1)
    expect(ends[0]).toHaveLength(2)

    teardown()
  })
})

describe("uplotChart yAxisChange (unit rescaling parity)", () => {
  const setup = (attributes = {}) => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", min: 5, max: 40, ...attributes },
    })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    return {
      sdk,
      chart,
      instance,
      u: instance.getUPlot(),
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("fires yAxisChange with the getValueRange data range, not the rendered scale", () => {
    const { chart, u, teardown } = setup()

    const ranges = []
    chart.on("yAxisChange", (min, max) => ranges.push([min, max]))

    u.scales.y.min = 999
    u.scales.y.max = 1234
    u.hooks.draw.forEach(hook => hook(u))

    expect(ranges).toEqual([[5, 40]])
    expect(chart.getAttribute("getValueRange")(chart)).toEqual([5, 40])

    teardown()
  })

  it("does not re-fire for an unchanged range but fires again once it changes", () => {
    const { chart, u, teardown } = setup()

    const ranges = []
    chart.on("yAxisChange", (min, max) => ranges.push([min, max]))

    u.hooks.draw.forEach(hook => hook(u))
    u.hooks.draw.forEach(hook => hook(u))
    expect(ranges).toEqual([[5, 40]])

    chart.updateAttribute("max", 50)
    u.hooks.draw.forEach(hook => hook(u))
    expect(ranges).toEqual([
      [5, 40],
      [5, 50],
    ])

    teardown()
  })

  it("keeps the fired range independent of yRangePad and fires only once", () => {
    const { chart, u, teardown } = setup()

    const ranges = []
    chart.on("yAxisChange", (min, max) => ranges.push([min, max]))

    const [renderedMin, renderedMax] = u.scales.y.range(u, 5, 40)
    expect(renderedMin).toBeLessThan(5)
    expect(renderedMax).toBeGreaterThan(40)

    u.hooks.draw.forEach(hook => hook(u))
    u.hooks.draw.forEach(hook => hook(u))

    expect(ranges).toEqual([[5, 40]])

    teardown()
  })

  it("drives the real unitConversion consumer without looping or overflowing the stack", async () => {
    const { chart, u, teardown } = setup()

    let fires = 0
    chart.on("yAxisChange", () => fires++)

    expect(() => {
      u.hooks.draw.forEach(hook => hook(u))
    }).not.toThrow()

    expect(chart.getAttribute("min")).toBe(5)
    expect(chart.getAttribute("max")).toBe(40)
    expect(fires).toBe(1)

    await Promise.resolve()
    await Promise.resolve()

    u.hooks.draw.forEach(hook => hook(u))
    expect(fires).toBe(1)

    teardown()
  })
})

describe("uplotChart axis visibility (enabledXAxis / enabledYAxis parity)", () => {
  const mountWith = attributes => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", ...attributes },
    })
    withLoadedPayload(chart)

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

  it("shows both axes with ticks by default", () => {
    const { instance, teardown } = mountWith({})
    const u = instance.getUPlot()

    expect(u.axes[0].show).toBe(true)
    expect(u.axes[1].show).toBe(true)
    expect(u.axes[0].ticks.show).not.toBe(false)
    expect(u.axes[1].ticks.show).not.toBe(false)

    teardown()
  })

  it("keeps y-axis gridlines but hides its ticks when enabledYAxis is false", () => {
    const { instance, teardown } = mountWith({ enabledYAxis: false })
    const u = instance.getUPlot()

    expect(u.axes[1].show).toBe(true)
    expect(u.axes[1].grid.show).toBe(true)
    expect(u.axes[1].ticks.show).toBe(false)
    expect(u.axes[0].ticks.show).not.toBe(false)

    teardown()
  })

  it("keeps x-axis gridlines but hides its ticks when enabledXAxis is false", () => {
    const { instance, teardown } = mountWith({ enabledXAxis: false })
    const u = instance.getUPlot()

    expect(u.axes[0].show).toBe(true)
    expect(u.axes[0].grid.show).toBe(true)
    expect(u.axes[0].ticks.show).toBe(false)
    expect(u.axes[1].ticks.show).not.toBe(false)

    teardown()
  })

  it("re-renders and restores y-axis ticks when the attribute toggles", () => {
    const { chart, instance, teardown } = mountWith({ enabledYAxis: false })
    expect(instance.getUPlot().axes[1].ticks.show).toBe(false)
    expect(instance.getUPlot().axes[1].grid.show).toBe(true)

    chart.updateAttribute("enabledYAxis", true)

    expect(instance.getUPlot().axes[1].ticks.show).not.toBe(false)

    teardown()
  })
})

describe("uplotChart yRangePad (dygraph parity)", () => {
  const mountLine = attributes => {
    const { sdk, chart } = makeTestChart({
      attributes: { loaded: true, chartType: "line", min: 10, max: 31, ...attributes },
    })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    return {
      instance,
      u: instance.getUPlot(),
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("pads a line chart y-range beyond the raw data extent at both ends", () => {
    const { u, teardown } = mountLine()

    const [min, max] = u.scales.y.range(u, 10, 31)
    expect(min).toBeLessThan(10)
    expect(max).toBeGreaterThan(31)

    teardown()
  })

  it("leaves the multiBar zero-based y-range unpadded", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "multiBar" } })
    chart.getPayload = () => ({
      data: [
        [1617946860000, 10, 20, 30],
        [1617946865000, 12, 18, 28],
        [1617946870000, 11, 22, 31],
      ],
      labels: ["time", "reads", "writes", "other"],
    })
    chart.getPayloadDimensionIds = () => ["reads", "writes", "other"]
    chart.getVisibleDimensionIds = () => ["reads", "writes", "other"]
    chart.isDimensionVisible = () => true
    chart.selectDimensionColor = () => "#3366CC"
    chart.getThemeAttribute = () => "#E4E8E8"
    chart.getConvertedValueWithUnit = value => `${value}`

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    const u = instance.getUPlot()
    const [min] = u.scales.y.range(u, 10, 31)
    expect(min).toBe(0)

    instance.unmount()
    document.body.removeChild(element)
  })
})

describe("uplotChart area zero baseline (dygraph parity)", () => {
  const mountArea = selectedLegendDimensions => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "area",
        min: 10,
        max: 31,
        selectedLegendDimensions,
      },
    })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    return {
      instance,
      u: instance.getUPlot(),
      teardown: () => (instance.unmount(), document.body.removeChild(element)),
    }
  }

  it("includes zero for multi-dimension, multi-selected area", () => {
    const { u, teardown } = mountArea(["load1", "load5"])

    const [min, max] = u.scales.y.range(u, 10, 31)
    expect(min).toBeLessThanOrEqual(0)
    expect(max).toBeGreaterThanOrEqual(31)

    teardown()
  })

  it("does not include zero when only one dimension is selected", () => {
    const { u, teardown } = mountArea(["load1"])

    const [min] = u.scales.y.range(u, 10, 31)
    expect(min).toBeGreaterThan(0)

    teardown()
  })
})

describe("uplotChart sparkline series styling (dygraph parity)", () => {
  it("renders each sparkline series as a solid fill with a zero-width stroke and no points", () => {
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
    for (let i = 1; i < u.series.length; i++) {
      expect(u.series[i].width).toBe(0)
      expect(u.series[i].fill(u, i)).toBe("#3366CC")
      expect(u.series[i].points.show(u, i)).toBe(false)
    }

    instance.unmount()
    document.body.removeChild(element)
  })

  it("keeps non-sparkline line series stroked and unfilled", () => {
    const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
    withLoadedPayload(chart)

    const instance = uplotChart(sdk, chart)
    const element = document.createElement("div")
    element.style.width = "800px"
    element.style.height = "300px"
    document.body.appendChild(element)
    instance.mount(element)

    const u = instance.getUPlot()
    expect(u.series[1].width).toBe(2)
    expect(u.series[1].fill(u, 1)).toBeNull()

    instance.unmount()
    document.body.removeChild(element)
  })
})
