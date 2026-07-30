import makeDefaultSDK from "@/makeDefaultSDK"
import systemLoadLine from "../../fixtures/systemLoadLine"

const marker = () => "preserved"

const withNavigatorGPU = run => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, "gpu")
  Object.defineProperty(navigator, "gpu", { configurable: true, value: {} })

  try {
    return run()
  } finally {
    if (descriptor) Object.defineProperty(navigator, "gpu", descriptor)
    else delete navigator.gpu
  }
}

const makeChart = ({ chartType = "line", chartLibrary, rendererPolicy } = {}) => {
  const sdk = makeDefaultSDK({ rendererPolicy })
  const chart = sdk.makeChart({
    attributes: {
      ...(chartType && { chartType }),
      ...(chartLibrary && { chartLibrary }),
    },
    ui: { marker },
  })
  sdk.appendChild(chart)
  return { chart, sdk }
}

const addRenderer = (sdk, name, { supported = true, fallbackRenderer } = {}) => {
  const renderer = (rendererSDK, chart) => ({
    chart,
    rendererSDK,
    getRendererId: () => name,
    mount: () => {},
    render: () => {},
    unmount: () => {},
  })
  renderer.isSupported = () => supported
  renderer.fallbackRenderer = fallbackRenderer
  sdk.addUI(name, renderer)
  return renderer
}

describe("internal renderer routing", () => {
  it("keeps the established public identity on the default renderer", () => {
    const { chart } = makeChart()

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getVisualizationType()).toBe("line")
    expect(chart.getRendererState()).toEqual({
      visualization: "line",
      requested: "dygraph",
      active: "dygraph",
      fallbackReason: null,
    })
    expect(chart.getUI().getDygraph()).toBeNull()
    expect(chart.getUI().marker()).toBe("preserved")
  })

  it.each(["line", "area", "heatmap", "multiBar", "stacked", "stackedBar"])(
    "routes accelerated %s internally without changing chartLibrary",
    visualization =>
      withNavigatorGPU(() => {
        const { chart } = makeChart({
          chartType: visualization,
          rendererPolicy: () => "webgpu",
        })

        expect(chart.getVisualizationType()).toBe(visualization)
        expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
        expect(chart.getRendererState().active).toBe("webgpu")
        expect(chart.getUI().getVisualizationId()).toBe(visualization)
      })
  )

  it.each(["d3pie", "easypiechart", "gauge"])(
    "routes accelerated %s internally without changing chartLibrary",
    visualization =>
      withNavigatorGPU(() => {
        const { chart } = makeChart({
          chartType: null,
          chartLibrary: visualization,
          rendererPolicy: () => "webgpu",
        })

        expect(chart.getVisualizationType()).toBe(visualization)
        expect(chart.getAttribute("chartLibrary")).toBe(visualization)
        expect(chart.getRendererState().active).toBe("webgpu")
        expect(chart.getUI().getVisualizationId()).toBe(visualization)
      })
  )

  it("resolves unsupported renderers through their private fallback chain", () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "primary" })
    addRenderer(sdk, "primary", {
      supported: false,
      fallbackRenderer: "secondary",
    })
    addRenderer(sdk, "secondary", {
      fallbackRenderer: "dygraph",
    })
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getRendererState()).toEqual({
      visualization: "line",
      requested: "primary",
      active: "secondary",
      fallbackReason: null,
    })
    expect(chart.getUI().getRendererId()).toBe("secondary")
  })

  it("skips an unsupported requested runtime fallback", () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "primary" })
    addRenderer(sdk, "primary")
    addRenderer(sdk, "secondary", {
      supported: false,
      fallbackRenderer: "dygraph",
    })
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(
      chart.fallbackRenderer("primary", "secondary", new Error("primary failed"))
    ).toBe(true)
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getRendererState()).toEqual({
      visualization: "line",
      requested: "primary",
      active: "dygraph",
      fallbackReason: "primary failed",
    })
    expect(chart.getUI().getDygraph()).toBeNull()
  })

  it("preserves custom UI additions when replacing a failed renderer", () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "primary" })
    addRenderer(sdk, "primary")
    const chart = sdk.makeChart({
      attributes: { chartType: "line" },
      ui: { marker },
    })
    sdk.appendChild(chart)

    expect(chart.fallbackRenderer("primary", null, new Error("failed"))).toBe(true)
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
    expect(chart.getUI().marker()).toBe("preserved")
  })

  it("ignores a stale failure from a renderer that is no longer active", () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "primary" })
    addRenderer(sdk, "primary")
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })
    sdk.appendChild(chart)

    expect(chart.fallbackRenderer("primary", null, new Error("failed"))).toBe(true)
    expect(chart.fallbackRenderer("primary", null, new Error("stale"))).toBe(false)
    expect(chart.getRendererState().active).toBe("dygraph")
  })

  it("reconciles after the first payload supplies visualization identity", async () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "number" })
    const chart = sdk.makeChart()
    sdk.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getRendererState().active).toBe("dygraph")

    chart.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve))

    expect(chart.getAttribute("chartType")).toBe("line")
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getRendererState().active).toBe("number")
    expect(chart.getUI().getDygraph).toBeUndefined()
  })

  it("reconciles charts appended through a nested container", () => {
    const sdk = makeDefaultSDK({ rendererPolicy: () => "number" })
    const container = sdk.makeContainer({ attributes: { id: "container" } })
    const chart = sdk.makeChart({ attributes: { chartType: "line" } })

    sdk.appendChild(container)
    container.appendChild(chart)

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getRendererState().active).toBe("number")
    expect(chart.getUI().getDygraph).toBeUndefined()
  })

  it("replaces an adapter when visualization changes on the same backend", () =>
    withNavigatorGPU(() => {
      const { chart } = makeChart({
        chartType: null,
        chartLibrary: "gauge",
        rendererPolicy: () => "webgpu",
      })
      const gaugeUI = chart.getUI()

      chart.updateChartTypeAttribute("d3pie")

      expect(chart.getVisualizationType()).toBe("d3pie")
      expect(chart.getAttribute("chartLibrary")).toBe("d3pie")
      expect(chart.getRendererState().active).toBe("webgpu")
      expect(chart.getUI()).not.toBe(gaugeUI)
      expect(chart.getUI().getVisualizationId()).toBe("d3pie")
    }))

  it("routes unsupported Gauge static zones directly to legacy Gauge", () => {
    const { chart } = makeChart({
      chartType: null,
      chartLibrary: "gauge",
      rendererPolicy: () => "webgpu",
    })
    chart.updateAttribute("staticZones", [
      { min: 0, max: 50, strokeStyle: "red" },
    ])
    chart.reconcileRenderer()

    expect(chart.getVisualizationType()).toBe("gauge")
    expect(chart.getAttribute("chartLibrary")).toBe("gauge")
    expect(chart.getRendererState().active).toBe("gauge")
  })

  it("keeps unsupported visualizations on their legacy implementation", () => {
    const { chart } = makeChart({
      chartType: null,
      chartLibrary: "table",
      rendererPolicy: () => "webgpu",
    })

    expect(chart.getVisualizationType()).toBe("table")
    expect(chart.getAttribute("chartLibrary")).toBe("table")
    expect(chart.getRendererState().active).toBe("table")
  })

  it("does not expose backend selection through chart attributes", () =>
    withNavigatorGPU(() => {
      const { chart } = makeChart({ rendererPolicy: () => "webgpu" })
      const attributes = chart.getAttributes()

      expect(attributes.chartLibrary).toBe("dygraph")
      expect(attributes).not.toHaveProperty("chartRenderersByVisualization")
      expect(attributes).not.toHaveProperty("chartLibrariesByType")
      expect(Object.values(attributes)).not.toContain("webgpu")
      expect(Object.values(attributes)).not.toContain("webgl2")
    }))
})
