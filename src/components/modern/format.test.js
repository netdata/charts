import { makeTestChart } from "@jest/testUtilities"
import { formatReadout, formatReadoutUnit } from "./format"

const defaultReadout = (chart, value, options = {}) => {
  const unitAttributes = chart.getUnitAttributesForValue(value, options)
  return {
    value: chart.getConvertedValue(value, { ...options, unitAttributes }),
    unit: chart.getUnitSign({ ...options, unitAttributes }),
  }
}

describe("formatReadout", () => {
  it.each([17.3459, 3.99561, 0.0042, 0, 99.99, 449.12, 2022.7, 1234567])(
    "formats %p exactly like the default per-value readout",
    value => {
      const { chart } = makeTestChart({ attributes: { units: "requests/s" } })
      const expected = defaultReadout(chart, value)

      expect(formatReadout(chart, value)).toBe(expected.value)
      expect(formatReadoutUnit(chart, value)).toBe(expected.unit)
    }
  )

  it("keeps the decimals the user chose", () => {
    const { chart } = makeTestChart({ attributes: { staticFractionDigits: 3 } })
    expect(formatReadout(chart, 17.3459)).toBe(defaultReadout(chart, 17.3459).value)
  })

  it("formats on the scale the caller passes", () => {
    const { chart } = makeTestChart({ attributes: { units: "requests/s" } })
    const unitAttributes = chart.getUnitAttributesForValue(2022.7)

    expect(formatReadout(chart, 2022.7, { unitAttributes })).toBe(
      chart.getConvertedValue(2022.7, { unitAttributes })
    )
  })

  it("shows a dash for missing values", () => {
    const { chart } = makeTestChart()
    expect(formatReadout(chart, null)).toBe("-")
    expect(formatReadout(chart, undefined)).toBe("-")
  })
})
