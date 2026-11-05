import { makeTestChart } from "@jest/testUtilities"
import { setEnabled, reset, snapshot } from "@/sdk/plugins/perfMonitor/registry"
import uplotChart from "@/chartLibraries/uplot"

const setupMountedChart = () => {
  const { sdk, chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })
  const ui = uplotChart(sdk, chart)
  chart.setUI(ui, "default")
  const element = document.createElement("div")
  document.body.appendChild(element)
  ui.mount(element)
  return { chart, ui, element }
}

describe("render timing seam", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    reset()
    setEnabled(false)
  })

  afterEach(() => {
    setEnabled(false)
    reset()
    jest.useRealTimers()
  })

  it("records a render sample tagged with the chart's renderer when enabled", async () => {
    const { chart, ui, element } = setupMountedChart()

    setEnabled(true)
    chart.invalidateRender()
    chart.trigger("render")
    jest.runOnlyPendingTimers()
    await Promise.resolve()

    const snap = snapshot()
    expect(snap.overall.count).toBeGreaterThanOrEqual(1)
    expect(snap.renderers.uplot.count).toBeGreaterThanOrEqual(1)

    ui.unmount()
    document.body.removeChild(element)
  })

  it("does not record when disabled", async () => {
    const { chart, ui, element } = setupMountedChart()

    chart.invalidateRender()
    chart.trigger("render")
    jest.runOnlyPendingTimers()
    await Promise.resolve()

    expect(snapshot().overall.count).toBe(0)

    ui.unmount()
    document.body.removeChild(element)
  })
})
