import { makeTestChart } from "@jest/testUtilities"
import { formatReadout, readoutDigits } from "./format"

describe("readoutDigits", () => {
  it("uses fewer decimals as the magnitude grows", () => {
    expect(readoutDigits(3.14159)).toBe(2)
    expect(readoutDigits(17.3459)).toBe(1)
    expect(readoutDigits(-250.5)).toBe(0)
  })
})

describe("formatReadout", () => {
  it("caps auto-scaled values instead of showing four decimals", () => {
    const { chart } = makeTestChart()
    expect(formatReadout(chart, 17.3459)).toBe("17.3")
    expect(formatReadout(chart, 3.99561)).toBe("4.00")
    expect(formatReadout(chart, 449.12)).toBe("449")
  })

  it("keeps the decimals the user chose", () => {
    const { chart } = makeTestChart({ attributes: { staticFractionDigits: 3 } })
    expect(formatReadout(chart, 17.3459)).toBe("17.346")
  })

  it("shows a dash for missing values", () => {
    const { chart } = makeTestChart()
    expect(formatReadout(chart, null)).toBe("-")
    expect(formatReadout(chart, undefined)).toBe("-")
  })
})
