import { makeTestChart } from "@jest/testUtilities"
import { formatReadout, readoutDigits } from "./format"

describe("readoutDigits", () => {
  it("uses fewer decimals as the magnitude grows", () => {
    expect(readoutDigits(3.14159)).toBe(2)
    expect(readoutDigits(17.3459)).toBe(1)
    expect(readoutDigits(-250.5)).toBe(0)
  })

  it("decides after rounding", () => {
    expect(readoutDigits(0)).toBe(0)
    expect(readoutDigits(99.99)).toBe(0)
    expect(readoutDigits(9.999)).toBe(0)
    expect(readoutDigits(9.994)).toBe(2)
  })
})

describe("formatReadout", () => {
  it("caps auto-scaled values instead of showing four decimals", () => {
    const { chart } = makeTestChart()
    expect(formatReadout(chart, 17.3459)).toBe("17.3")
    expect(formatReadout(chart, 3.99561)).toBe("4")
    expect(formatReadout(chart, 3.9912)).toBe("3.99")
    expect(formatReadout(chart, 0)).toBe("0")
    expect(formatReadout(chart, 99.99)).toBe("100")
    expect(formatReadout(chart, 449.12)).toBe("449")
  })

  it("keeps the decimals the user chose", () => {
    const { chart } = makeTestChart({ attributes: { staticFractionDigits: 3 } })
    expect(formatReadout(chart, 17.3459)).toBe("17.346")
  })

  it("formats on the scale the caller passes", () => {
    const { chart } = makeTestChart({ attributes: { units: "requests/s" } })
    const unitAttributes = chart.getUnitAttributesForValue(2022.7)

    expect(formatReadout(chart, 2022.7, { unitAttributes })).toBe("2.02")
    expect(formatReadout(chart, 2022.7, { unitAttributes, withUnit: true })).toMatch(/^2\.02 K/)
  })

  it("shows a dash for missing values", () => {
    const { chart } = makeTestChart()
    expect(formatReadout(chart, null)).toBe("-")
    expect(formatReadout(chart, undefined)).toBe("-")
  })
})
