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

  it("falls back to dygraph when a mapped renderer is not registered", () => {
    const chart = makeChart({ line: "missing-renderer" })

    expect(chart.getAttribute("chartLibrary")).toBe("dygraph")
    expect(chart.getUI().getDygraph()).toBeNull()
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
})
