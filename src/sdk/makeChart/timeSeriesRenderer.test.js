import makeDefaultSDK from "@/makeDefaultSDK"

const makeLineChart = (sdkAttributes = {}, chartAttributes = {}) => {
  const sdk = makeDefaultSDK({ attributes: sdkAttributes })
  const chart = sdk.makeChart({ attributes: { chartLibrary: "dygraph", ...chartAttributes } })
  sdk.appendChild(chart)
  return { sdk, chart }
}

const isUplotUI = chart => typeof chart.getUI()?.getUPlot === "function"

describe("timeSeriesRenderer", () => {
  it("keeps dygraph when the option is unset", () => {
    const { chart } = makeLineChart()

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(isUplotUI(chart)).toBe(false)
  })

  it("creates dygraph charts as uPlot when the option is uplot", () => {
    const { chart } = makeLineChart({ timeSeriesRenderer: "uplot" })

    expect(chart.getAttribute("chartLibrary")).toBe("uplot")
    expect(chart.getAttribute("rendererOverridden")).toBe(true)
    expect(isUplotUI(chart)).toBe(true)
  })

  it("leaves non time-series charts alone", () => {
    const { chart } = makeLineChart({ timeSeriesRenderer: "uplot" }, { chartLibrary: "gauge" })

    expect(chart.getAttribute("chartLibrary")).toBe("gauge")
  })

  it("swaps a mounted chart to uPlot and back", () => {
    const { sdk, chart } = makeLineChart()

    sdk.getNodes().forEach(node => node.updateAttribute("timeSeriesRenderer", "uplot"))
    expect(chart.getAttribute("chartLibrary")).toBe("uplot")
    expect(isUplotUI(chart)).toBe(true)

    sdk.getNodes().forEach(node => node.updateAttribute("timeSeriesRenderer", null))
    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(isUplotUI(chart)).toBe(false)
  })

  it("does not switch charts that chose uPlot themselves back to dygraph", () => {
    const { sdk, chart } = makeLineChart({}, { chartLibrary: "uplot" })

    sdk.getNodes().forEach(node => node.updateAttribute("timeSeriesRenderer", null))
    expect(chart.getAttribute("chartLibrary")).toBe("uplot")
  })
})
