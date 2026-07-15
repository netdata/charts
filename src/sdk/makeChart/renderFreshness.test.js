import { makeTestChart } from "@jest/testUtilities"
import makeChartUI from "@/sdk/makeChartUI"

const flushRender = () => new Promise(resolve => setTimeout(resolve, 10))

const makeCountingUI = (sdk, chart, { fail = false, defer = false } = {}) => {
  const chartUI = makeChartUI(sdk, chart)
  let attempts = 0
  let shouldFail = fail
  let shouldDefer = defer

  const render = () => {
    attempts += 1

    if (shouldFail) {
      shouldFail = false
      throw new Error("render failed")
    }

    if (shouldDefer) {
      shouldDefer = false
      return false
    }

    chartUI.render()
    return true
  }

  return {
    ...chartUI,
    render,
    getAttempts: () => attempts,
  }
}

describe("chart render freshness", () => {
  it("coalesces render requests and skips every request after the UI becomes fresh", async () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeCountingUI(sdk, chart)
    chart.setUI(chartUI)
    chartUI.mount(document.createElement("div"))

    chart.trigger("render")
    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(1)

    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(1)
  })

  it("does not redraw when only the live clock advances", async () => {
    const { sdk, chart } = makeTestChart({ attributes: { after: -300, liveAnchor: null } })
    const chartUI = makeCountingUI(sdk, chart)
    chart.setUI(chartUI)
    chartUI.mount(document.createElement("div"))

    chart.trigger("render")
    await flushRender()

    sdk.getRoot().setAttribute("fetchAt", Date.now() + 1000)
    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(1)
  })

  it("renders every UI once after shared data invalidation", async () => {
    const { sdk, chart } = makeTestChart()
    const defaultUI = makeCountingUI(sdk, chart)
    const secondaryUI = makeCountingUI(sdk, chart)
    chart.setUI(defaultUI)
    chart.setUI(secondaryUI, "secondary")
    defaultUI.mount(document.createElement("div"))
    secondaryUI.mount(document.createElement("div"))

    chart.trigger("render")
    await flushRender()

    chart.invalidateRender()
    chart.trigger("render")
    chart.trigger("render")
    await flushRender()

    expect(defaultUI.getAttempts()).toBe(2)
    expect(secondaryUI.getAttempts()).toBe(2)
  })

  it("invalidates one UI for a size or presentation change without redrawing the others", async () => {
    const { sdk, chart } = makeTestChart()
    const defaultUI = makeCountingUI(sdk, chart)
    const secondaryUI = makeCountingUI(sdk, chart)
    chart.setUI(defaultUI)
    chart.setUI(secondaryUI, "secondary")
    defaultUI.mount(document.createElement("div"))
    secondaryUI.mount(document.createElement("div"))

    chart.trigger("render")
    await flushRender()

    secondaryUI.invalidateRender()
    chart.trigger("render")
    await flushRender()

    expect(defaultUI.getAttempts()).toBe(1)
    expect(secondaryUI.getAttempts()).toBe(2)
  })

  it("does not consume revisions while unmounted and renders once after remount", async () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeCountingUI(sdk, chart)
    chart.setUI(chartUI)

    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(0)

    chartUI.mount(document.createElement("div"))
    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(1)

    chartUI.unmount()
    chart.invalidateRender()
    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(1)

    chartUI.mount(document.createElement("div"))
    chart.trigger("render")
    await flushRender()

    expect(chartUI.getAttempts()).toBe(2)
  })

  it("keeps a deferred or failed render stale for retry", () => {
    const { sdk, chart } = makeTestChart()
    const deferredUI = makeCountingUI(sdk, chart, { defer: true })
    const failingUI = makeCountingUI(sdk, chart, { fail: true })
    deferredUI.mount(document.createElement("div"))
    failingUI.mount(document.createElement("div"))

    expect(deferredUI.renderIfStale(deferredUI.render)).toBe(false)
    expect(deferredUI.isRenderStale()).toBe(true)
    expect(deferredUI.renderIfStale(deferredUI.render)).toBe(true)
    expect(deferredUI.isRenderStale()).toBe(false)

    expect(() => failingUI.renderIfStale(failingUI.render)).toThrow("render failed")
    expect(failingUI.isRenderStale()).toBe(true)
    expect(failingUI.renderIfStale(failingUI.render)).toBe(true)
    expect(failingUI.isRenderStale()).toBe(false)
  })

  it("invalidates the UI when its rendered target is mounted or unmounted", () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeChartUI(sdk, chart)

    chartUI.render()
    expect(chartUI.isRenderStale()).toBe(false)

    chartUI.mount(document.createElement("div"))
    expect(chartUI.isRenderStale()).toBe(true)

    chartUI.render()
    chartUI.unmount()
    expect(chartUI.isRenderStale()).toBe(true)
  })

  it("tracks visible-dimension changes only while the UI is mounted", () => {
    const { sdk, chart } = makeTestChart()
    const chartUI = makeChartUI(sdk, chart)

    chartUI.mount(document.createElement("div"))
    chartUI.render()
    chart.trigger("visibleDimensionsChanged")

    expect(chartUI.isRenderStale()).toBe(true)

    chartUI.unmount()
    chartUI.render()
    chart.trigger("visibleDimensionsChanged")

    expect(chartUI.isRenderStale()).toBe(false)
  })
})
