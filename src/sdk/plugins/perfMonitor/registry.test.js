import {
  setEnabled,
  isEnabled,
  record,
  timeRender,
  snapshot,
  reset,
  sampleHeap,
} from "./registry"

describe("perf registry", () => {
  beforeEach(() => {
    reset()
    setEnabled(false)
  })

  it("records durations and computes per-renderer and overall stats", () => {
    record("c1", "uplot", 10)
    record("c1", "uplot", 20)
    record("c1", "uplot", 30)

    const snap = snapshot()
    expect(snap.overall.count).toBe(3)
    expect(snap.overall.p50).toBe(20)
    expect(snap.overall.max).toBe(30)
    expect(snap.renderers.uplot.count).toBe(3)
  })

  it("clears all samples on reset", () => {
    record("c1", "dygraph", 5)
    reset()
    expect(snapshot().overall.count).toBe(0)
  })

  it("timeRender always calls fn but records only when enabled", () => {
    let calls = 0
    const fn = () => {
      calls++
    }

    timeRender("c1", "uplot", fn)
    expect(calls).toBe(1)
    expect(snapshot().overall.count).toBe(0)

    setEnabled(true)
    timeRender("c1", "uplot", fn)
    expect(calls).toBe(2)
    expect(snapshot().overall.count).toBe(1)
  })

  it("reports heap unsupported when performance.memory is absent", () => {
    sampleHeap()
    expect(snapshot().heap.supported).toBe(false)
  })
})
