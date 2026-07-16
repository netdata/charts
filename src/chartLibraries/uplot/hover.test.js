import { makeTestChart, loadHeatmapPayload } from "@jest/testUtilities"
import uplotChart from "./index"
import makeGetHoverDimension from "./hover"

const after = 1617946860
const before = 1617947760

const withPayload = (chart, data, dims) => {
  chart.getPayload = () => ({ data, labels: ["time", ...dims] })
  chart.getPayloadDimensionIds = () => dims
  chart.getVisibleDimensionIds = () => dims
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#E4E8E8"
  chart.getConvertedValueWithUnit = value => `${value}`
}

const mount = async (chartType, data, dims, attributes = {}) => {
  const { sdk, chart } = makeTestChart({
    attributes: { loaded: true, chartType, chartLibrary: "uplot", after, before, ...attributes },
  })
  withPayload(chart, data, dims)

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
    u: instance.getUPlot(),
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

const lineData = [
  [after * 1000, 10, 90],
  [(after + 5) * 1000, 12, 88],
  [(after + 10) * 1000, 11, 92],
]

describe("uplot hover dimension resolution", () => {
  it("resolves the nearest visible series by cursor Y, not always the first", async () => {
    const { chart, u, teardown } = await mount("line", lineData, ["low", "high"], {
      staticValueRange: [0, 100],
    })
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: 100, top: u.valToPos(90, "y"), idx: 0 }
    expect(getDim(u)).toBe("high")

    u.cursor = { left: 100, top: u.valToPos(10, "y"), idx: 0 }
    expect(getDim(u)).toBe("low")

    teardown()
  })

  it("resolves ANOMALY_RATE at the top band and ANNOTATIONS at the bottom band", async () => {
    const { chart, u, teardown } = await mount("line", lineData, ["low", "high"], {
      staticValueRange: [0, 100],
    })
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: 100, top: 5, idx: 0 }
    expect(getDim(u)).toBe("ANOMALY_RATE")

    u.cursor = { left: 100, top: u.over.clientHeight - 2, idx: 0 }
    expect(getDim(u)).toBe("ANNOTATIONS")

    teardown()
  })

  it("ignores the ribbon bands when showAnomalies/showAnnotations are off", async () => {
    const { chart, u, teardown } = await mount("line", lineData, ["low", "high"], {
      staticValueRange: [0, 100],
      showAnomalies: false,
      showAnnotations: false,
    })
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: 100, top: 5, idx: 0 }
    expect(getDim(u)).toBe("high")

    u.cursor = { left: 100, top: u.over.clientHeight - 2, idx: 0 }
    expect(getDim(u)).toBe("low")

    teardown()
  })

  it("resolves the stacked series whose band contains the cursor Y", async () => {
    const stackedData = [
      [after * 1000, 10, 20],
      [(after + 5) * 1000, 10, 20],
      [(after + 10) * 1000, 10, 20],
    ]
    const { chart, u, teardown } = await mount("stacked", stackedData, ["a", "b"])
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: 100, top: u.valToPos(25, "y"), idx: 0 }
    expect(getDim(u)).toBe("b")

    u.cursor = { left: 100, top: u.valToPos(5, "y"), idx: 0 }
    expect(getDim(u)).toBe("a")

    teardown()
  })

  it("resolves the stacked-bar segment under the cursor Y", async () => {
    const barData = [
      [after * 1000, 10, 20],
      [(after + 5) * 1000, 10, 20],
      [(after + 10) * 1000, 10, 20],
    ]
    const { chart, u, teardown } = await mount("stackedBar", barData, ["a", "b"], {
      staticValueRange: [0, 30],
    })
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: 100, top: u.valToPos(25, "y"), idx: 0 }
    expect(getDim(u)).toBe("b")

    u.cursor = { left: 100, top: u.valToPos(5, "y"), idx: 0 }
    expect(getDim(u)).toBe("a")

    teardown()
  })

  it("falls back to the first visible dimension when the cursor has no index", async () => {
    const { chart, u, teardown } = await mount("line", lineData, ["low", "high"], {
      staticValueRange: [0, 100],
    })
    const getDim = makeGetHoverDimension(chart)

    u.cursor = { left: null, top: null, idx: null }
    expect(getDim(u)).toBe("low")

    teardown()
  })
})

describe("uplot hover dimension resolution — heatmap", () => {
  const heatmapIds = ["0", "1", "2", "3", "4", "5", "6"]
  const heatmapRows = [
    [0, 0, 1, 0, 2, 0, 0],
    [0, 0, 0, 3, 1, 0, 0],
    [0, 0, 2, 0, 0, 0, 0],
  ]

  it("resolves the heatmap bucket nearest the cursor Y", async () => {
    const { sdk, chart } = makeTestChart({
      attributes: {
        loaded: true,
        chartType: "heatmap",
        chartLibrary: "uplot",
        context: "prometheus.test.histogram",
        groupBy: ["dimension"],
        selectedLegendDimensions: [],
        showAnomalies: false,
        showAnnotations: false,
        viewDimensions: {
          ids: heatmapIds,
          names: heatmapIds,
          priorities: heatmapIds.map((_, index) => index),
          units: heatmapIds.map(() => ""),
          contexts: heatmapIds.map(() => ""),
          grouped: ["dimension"],
        },
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
    instance.mount(element)
    await Promise.resolve()
    await Promise.resolve()

    const u = instance.getUPlot()
    const getDim = makeGetHoverDimension(chart)
    const visibleIds = chart.getVisibleHeatmapIds()

    visibleIds.forEach(id => {
      const yIndex = chart.getHeatmapYIndex(id)
      u.cursor = { left: 100, top: u.valToPos(yIndex, "y"), idx: 0 }
      expect(getDim(u)).toBe(id)
    })

    instance.unmount()
    document.body.removeChild(element)
  })
})
