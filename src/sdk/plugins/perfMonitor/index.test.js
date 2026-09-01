import { act } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import { isEnabled, reset, record } from "./registry"

describe("perfMonitor plugin", () => {
  afterEach(() => {
    document.body.innerHTML = ""
    reset()
  })

  it("exposes a snapshot handle on window for automated benchmarks while enabled", () => {
    const { sdk } = makeTestChart()

    expect(window.__netdataPerf).toBeUndefined()

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: true })
    })

    expect(typeof window.__netdataPerf.snapshot).toBe("function")
    expect(typeof window.__netdataPerf.reset).toBe("function")

    record("c1", "uplot", 12)
    expect(window.__netdataPerf.snapshot().renderers.uplot.count).toBe(1)

    window.__netdataPerf.reset()
    expect(window.__netdataPerf.snapshot().overall.count).toBe(0)

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: false })
    })

    expect(window.__netdataPerf).toBeUndefined()
  })

  it("mounts the overlay and enables the registry when perfMonitor turns on, and tears down when off", () => {
    const { sdk } = makeTestChart()

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: true })
    })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).not.toBeNull()
    expect(isEnabled()).toBe(true)

    act(() => {
      sdk.getRoot().updateAttributes({ perfMonitor: false })
    })

    expect(document.querySelector("[data-testid='perfOverlay-root']")).toBeNull()
    expect(isEnabled()).toBe(false)
  })
})
