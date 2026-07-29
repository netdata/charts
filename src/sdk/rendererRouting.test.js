import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../fixtures/systemLoadLine"

const marker = () => "preserved"

const makeChart = (chartLibrariesByType, chartType = "line") => {
  const sdk = makeDefaultSDK({ attributes: { chartLibrariesByType } })
  const chart = sdk.makeChart({ attributes: { chartType }, ui: { marker } })
  sdk.appendChild(chart)
  return chart
}

describe("time-series renderer routing", () => {
  it("reconciles the renderer after root attributes are inherited", () => {
    const chart = makeChart({ line: "number" })

    expect(chart.getAttribute("chartLibrary")).toBe("number")
    expect(chart.getUI().getDygraph).toBeUndefined()
    expect(chart.getUI().chart).toBe(chart)
    expect(chart.getUI().marker()).toBe("preserved")
    expect(chart.isVisualizationRenderer()).toBe(true)
    expect(chart.isTimeSeriesRenderer()).toBe(true)
  })

  it("switches a routed chart back to dygraph", () => {
    const chart = makeChart({ line: "number" })

    chart.updateAttribute("chartLibrariesByType", { line: "dygraph" })
    chart.reconcileChartLibrary()

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
    expect(chart.getUI().chart).toBe(chart)
  })

  it("does not reroute a renderer selected as a standalone chart library", () => {
    const chart = makeChart({ line: "number" })

    chart.updateChartTypeAttribute("number")

    expect(chart.isTimeSeriesRenderer("number")).toBe(false)
    expect(chart.reconcileChartLibrary()).toBe(false)
    expect(chart.getAttribute("chartLibrary")).toBe("number")
  })

  it("keeps unmapped time-series types on dygraph", () => {
    const chart = makeChart({ line: "number" }, "area")

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
  })

  it("routes the supported Area visualization through WebGPU", () => {
    const descriptor = Object.getOwnPropertyDescriptor(navigator, "gpu")
    Object.defineProperty(navigator, "gpu", { configurable: true, value: {} })

    try {
      const sdk = makeDefaultSDK({
        attributes: { chartRenderersByVisualization: { area: "webgpu" } },
      })
      const chart = sdk.makeChart({ attributes: { chartType: "area" } })
      sdk.appendChild(chart)

      expect(chart.getVisualizationType()).toBe("area")
      expect(chart.getAttribute("chartLibrary")).toBe("webgpu")
      expect(chart.isTimeSeriesRenderer()).toBe(true)
    } finally {
      if (descriptor) Object.defineProperty(navigator, "gpu", descriptor)
      else delete navigator.gpu
    }
  })

  it("falls back to dygraph when a mapped renderer is not registered", () => {
    const chart = makeChart({ line: "missing-renderer" })

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
  })

  it("falls back before construction when a registered renderer is unsupported", () => {
    const unsupported = () => null
    unsupported.isSupported = () => false
    const sdk = makeDefaultSDK({
      attributes: { chartLibrariesByType: { line: "unsupported" } },
    })
    sdk.addUI("unsupported", unsupported)
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
  })

  it("resolves an unsupported preferred renderer through its accelerated fallback", () => {
    const primary = () => null
    primary.isSupported = () => false
    primary.fallbackRenderer = "secondary"
    const secondary = (sdk, chart) => ({ sdk, chart })
    secondary.isSupported = () => true
    secondary.fallbackRenderer = "dygraph"
    const sdk = makeDefaultSDK({
      attributes: { chartRenderersByVisualization: { line: "primary" } },
    })
    sdk.addUI("primary", primary)
    sdk.addUI("secondary", secondary)
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("secondary")
    expect(chart.getVisualizationType()).toBe("line")
    expect(chart.isTimeSeriesRenderer()).toBe(true)
  })

  it("skips an unsupported requested runtime fallback", () => {
    const primary = (sdk, chart) => ({ sdk, chart })
    primary.isSupported = () => true
    const secondary = () => null
    secondary.isSupported = () => false
    secondary.fallbackRenderer = "dygraph"
    const sdk = makeDefaultSDK({
      attributes: { chartRenderersByVisualization: { line: "primary" } },
    })
    sdk.addUI("primary", primary)
    sdk.addUI("secondary", secondary)
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(chart.fallbackChartLibrary("primary", "secondary")).toBe(true)
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
  })

  it("replaces a failed active renderer with dygraph", () => {
    const chart = makeChart({ line: "number" })

    expect(chart.fallbackChartLibrary("number")).toBe(true)
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
    expect(chart.getUI().marker()).toBe("preserved")
  })

  it("ignores a stale failure from a renderer that is no longer active", () => {
    const chart = makeChart({ line: "number" })
    chart.updateAttribute("chartLibrariesByType", { line: "dygraph" })
    chart.reconcileChartLibrary()

    expect(chart.fallbackChartLibrary("number")).toBe(false)
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
  })

  it("reconciles after the first payload supplies the chart type", async () => {
    const sdk = makeDefaultSDK({
      attributes: { chartLibrariesByType: { line: "number" } },
    })
    const chart = sdk.makeChart()
    sdk.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")

    chart.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve))

    expect(chart.getAttribute("chartType")).toBe("line")
    expect(chart.getAttribute("chartLibrary")).toBe("number")
    expect(chart.getUI().getDygraph).toBeUndefined()
  })

  it("reconciles charts appended through a nested container", () => {
    const sdk = makeDefaultSDK({
      attributes: { chartLibrariesByType: { line: "number" } },
    })
    const container = sdk.makeContainer({ attributes: { id: "container" } })
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })

    sdk.appendChild(container)
    container.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("number")
    expect(chart.getUI().getDygraph).toBeUndefined()
  })

  it("routes a standalone visualization independently from its renderer", () => {
    const sdk = makeDefaultSDK({
      attributes: { chartRenderersByVisualization: { gauge: "number" } },
    })
    const chart = sdk.makeChart({ attributes: { chartLibrary: "gauge" } })
    sdk.appendChild(chart)

    expect(chart.getVisualizationType()).toBe("gauge")
    expect(chart.getAttribute("chartLibrary")).toBe("number")
    expect(chart.isVisualizationRenderer("number")).toBe(true)
    expect(chart.isVisualizationRenderer()).toBe(true)
    expect(chart.isTimeSeriesRenderer("number")).toBe(false)
    expect(chart.isTimeSeriesRenderer()).toBe(false)
  })

  it("falls a standalone visualization back to its legacy renderer", () => {
    const sdk = makeDefaultSDK({
      attributes: { chartRenderersByVisualization: { gauge: "number" } },
    })
    const chart = sdk.makeChart({ attributes: { chartLibrary: "gauge" } })
    sdk.appendChild(chart)

    expect(chart.fallbackChartLibrary("number")).toBe(true)
    expect(chart.getVisualizationType()).toBe("gauge")
    expect(chart.getAttribute("chartLibrary")).toBe("gauge")
  })

  it("keeps a visualization on its legacy renderer when WebGPU has no adapter for it", () => {
    const sdk = makeDefaultSDK({
      attributes: { chartRenderersByVisualization: { gauge: "webgpu" } },
    })
    const chart = sdk.makeChart({ attributes: { chartLibrary: "gauge" } })
    sdk.appendChild(chart)

    expect(chart.getVisualizationType()).toBe("gauge")
    expect(chart.getAttribute("chartLibrary")).toBe("gauge")
  })
})
