import { act } from "@testing-library/react"
import { renderHookWithChart } from "@jest/testUtilities"
import { getAlertLabel, getAlertState, getThresholdColor, useAttention } from "./attention"

const bands = [
  { id: "ok", from: 0, color: ["#00AB44", "#00AB45"] },
  { id: "warn", from: 80, color: ["#FFCC26", "#FFCC27"] },
  { id: "crit", from: 95, color: ["#F95251", "#F95252"] },
]

describe("getAlertState", () => {
  it("is quiet without raised alerts", () => {
    expect(getAlertState(undefined)).toBeNull()
    expect(getAlertState({})).toBeNull()
    expect(getAlertState({ load: { nm: "load", cl: 3 } })).toBeNull()
  })

  it("reports warnings", () => {
    expect(getAlertState({ a: { wr: 1 }, b: { cl: 1 } })).toEqual({
      level: "warning",
      count: 1,
      tone: "warning",
    })
  })

  it("lets critical win over warning and sums the counts", () => {
    expect(getAlertState({ a: { wr: 2 }, b: { cr: 1 }, c: { cr: 2 } })).toEqual({
      level: "critical",
      count: 3,
      tone: "error",
    })
  })
})

describe("getAlertLabel", () => {
  it("names a single alert by its level", () => {
    expect(getAlertLabel({ level: "critical", count: 1 })).toBe("Critical")
    expect(getAlertLabel({ level: "warning", count: 1 })).toBe("Warning")
  })

  it("counts several alerts", () => {
    expect(getAlertLabel({ level: "warning", count: 2 })).toBe("2 warning")
  })
})

describe("getThresholdColor", () => {
  it("is neutral without thresholds or a value", () => {
    expect(getThresholdColor(null, 50, 0)).toBeNull()
    expect(getThresholdColor([], 50, 0)).toBeNull()
    expect(getThresholdColor(bands, null, 0)).toBeNull()
    expect(getThresholdColor(bands, NaN, 0)).toBeNull()
  })

  it("stays neutral inside the base band", () => {
    expect(getThresholdColor(bands, 50, 0)).toBeNull()
  })

  it("colours a value that crossed a band, per theme", () => {
    expect(getThresholdColor(bands, 85, 0)).toBe("#FFCC26")
    expect(getThresholdColor(bands, 99, 0, 1)).toBe("#F95252")
  })

  it("treats the first band as crossed when it starts above the range minimum", () => {
    const [, warn] = bands
    expect(getThresholdColor([warn], 85, 0)).toBe("#FFCC26")
    expect(getThresholdColor([warn], 50, 0)).toBeNull()
  })

  it("ignores malformed rows and unsorted input", () => {
    const rows = [{ from: 95, color: ["#F95251"] }, { from: "x" }, null, bands[1]]
    expect(getThresholdColor(rows, 90, 0)).toBe("#FFCC26")
  })
})

describe("useAttention", () => {
  it("is neutral by default", () => {
    const { result } = renderHookWithChart(() => useAttention(50, 0))

    expect(result.current).toEqual({ alert: null, color: null })
  })

  it("follows raised alerts", () => {
    const { result, chart } = renderHookWithChart(() => useAttention(50, 0))

    act(() => chart.updateAttribute("alerts", { cpu: { nm: "cpu", cr: 1 } }))

    expect(result.current.alert.level).toBe("critical")
    expect(result.current.color).toBe("error")
  })

  it("uses value thresholds when no alert is raised", () => {
    const { result } = renderHookWithChart(() => useAttention(90, 0), {
      attributes: { gaugeThresholds: bands },
    })

    expect(result.current).toEqual({ alert: null, color: "#FFCC26" })
  })
})
