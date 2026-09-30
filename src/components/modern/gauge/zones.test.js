import { makeZones, zoneAt, alertSeverity, worstSeverity } from "./zones"

const green = ["#00AB44", "#00AB44"]
const yellow = ["#FFCC26", "#FFCC26"]
const red = ["#F95251", "#F95251"]

const thresholds = [
  { id: "c", from: 90, color: red },
  { id: "a", from: 0, color: green },
  { id: "b", from: 80, color: yellow },
]

describe("makeZones", () => {
  it("returns no zones without thresholds or a range", () => {
    expect(makeZones(null, 0, 100)).toEqual([])
    expect(makeZones([], 0, 100)).toEqual([])
    expect(makeZones(thresholds, 10, 10)).toEqual([])
  })

  it("sorts rows into contiguous zones up to max and names severities by palette", () => {
    expect(makeZones(thresholds, 0, 100)).toEqual([
      { id: "a", from: 0, to: 80, color: "#00AB44", severity: "ok" },
      { id: "b", from: 80, to: 90, color: "#FFCC26", severity: "warning" },
      { id: "c", from: 90, to: 100, color: "#F95251", severity: "critical" },
    ])
  })

  it("clamps zones to the value range and drops zones above it", () => {
    expect(makeZones(thresholds, 85, 88)).toEqual([
      { id: "b", from: 85, to: 88, color: "#FFCC26", severity: "warning" },
    ])
  })

  it("keeps the last row when two share a start and picks the theme colour", () => {
    const rows = [
      { id: "x", from: 50, color: yellow },
      { id: "y", from: 50, color: ["#123456", "#654321"] },
    ]
    expect(makeZones(rows, 0, 100, 1)).toEqual([
      { id: "y", from: 50, to: 100, color: "#654321", severity: "warning" },
    ])
  })

  it("treats a custom colour as ok only for the base zone", () => {
    const rows = [
      { id: "base", from: 0, color: ["#111111", "#111111"] },
      { id: "high", from: 60, color: ["#222222", "#222222"] },
    ]
    expect(makeZones(rows, 0, 100).map(z => z.severity)).toEqual(["ok", "warning"])
  })

  it("ignores malformed rows", () => {
    expect(makeZones([null, { from: "1", color: red }, { from: 5 }], 0, 10)).toEqual([])
  })
})

describe("zoneAt", () => {
  const zones = makeZones(thresholds, 0, 100)

  it("finds the zone holding the value", () => {
    expect(zoneAt(zones, 10).id).toBe("a")
    expect(zoneAt(zones, 80).id).toBe("b")
    expect(zoneAt(zones, 95).id).toBe("c")
  })

  it("keeps values past max in the last zone", () => {
    expect(zoneAt(zones, 150).id).toBe("c")
  })

  it("returns null below the first zone or without a value", () => {
    expect(zoneAt(makeZones([{ from: 50, color: red }], 0, 100), 10)).toBeNull()
    expect(zoneAt(zones, null)).toBeNull()
  })
})

describe("alert severity", () => {
  it("reads critical and warning counts from the payload alerts", () => {
    expect(alertSeverity({})).toBe("ok")
    expect(alertSeverity(undefined)).toBe("ok")
    expect(alertSeverity({ a: { nm: "a", cl: 2 } })).toBe("ok")
    expect(alertSeverity({ a: { wr: 1 }, b: { cl: 1 } })).toBe("warning")
    expect(alertSeverity({ a: { wr: 1 }, b: { cr: 1 } })).toBe("critical")
  })

  it("picks the worst severity", () => {
    expect(worstSeverity("ok", "warning")).toBe("warning")
    expect(worstSeverity("critical", "warning")).toBe("critical")
    expect(worstSeverity("ok", "ok")).toBe("ok")
  })
})
