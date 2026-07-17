import { makeTestChart } from "@jest/testUtilities"
import { setEnabled, reset, snapshot } from "@/sdk/plugins/perfMonitor/registry"

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
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })

    setEnabled(true)
    chart.trigger("render")
    jest.runOnlyPendingTimers()
    await Promise.resolve()

    const snap = snapshot()
    expect(snap.overall.count).toBeGreaterThanOrEqual(1)
    expect(snap.renderers.uplot.count).toBeGreaterThanOrEqual(1)
  })

  it("does not record when disabled", async () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot" } })

    chart.trigger("render")
    jest.runOnlyPendingTimers()
    await Promise.resolve()

    expect(snapshot().overall.count).toBe(0)
  })
})
