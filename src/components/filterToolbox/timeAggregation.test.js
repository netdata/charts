import { renderHook } from "@testing-library/react"
import { useMenuItems } from "./timeAggregation"

const chart = { track: name => name }

describe("time aggregation menu items", () => {
  it("offers latest with a LATEST() short label", () => {
    const { result } = renderHook(() => useMenuItems(chart))
    const latest = result.current.find(item => item.value === "latest")

    expect(latest).toBeTruthy()
    expect(latest.short).toBe("LATEST()")
    expect(latest.label).toBe("Latest value")
  })

  it("precedes latest with a description-only separator", () => {
    const { result } = renderHook(() => useMenuItems(chart))
    const index = result.current.findIndex(item => item.value === "latest")

    expect(index).toBeGreaterThan(0)
    expect(result.current[index - 1].justDesc).toBe(true)
  })

  it("keeps the everyday functions ahead of latest", () => {
    const { result } = renderHook(() => useMenuItems(chart))
    const valueAt = value => result.current.findIndex(item => item.value === value)

    expect(valueAt("min")).toBeLessThan(valueAt("latest"))
    expect(valueAt("max")).toBeLessThan(valueAt("latest"))
    expect(valueAt("average")).toBeLessThan(valueAt("latest"))
    expect(valueAt("sum")).toBeLessThan(valueAt("latest"))
  })

  it("mentions the older-agent fallback in the description", () => {
    const { result } = renderHook(() => useMenuItems(chart))
    const latest = result.current.find(item => item.value === "latest")

    expect(latest.description).toMatch(/fall back to average/i)
  })
})
