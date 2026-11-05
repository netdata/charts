import formatNumber, { formatRegularNumber, shouldUseExponential } from "./index"
import { makeTestChart } from "@jest/testUtilities"

describe("formatNumber", () => {
  let chart

  beforeEach(() => {
    chart = makeTestChart({
      attributes: {
        locale: "en-US",
      },
    }).chart
  })

  it("resolves fraction digits from explicit and unit-conversion settings", () => {
    const cases = [
      {
        value: 1.23456,
        fractionDigits: undefined,
        unitsConversionFractionDigits: undefined,
        expected: "1.235",
      },
      {
        value: 1.23456,
        fractionDigits: undefined,
        unitsConversionFractionDigits: 2,
        expected: "1.23",
      },
      {
        value: 1.23456,
        fractionDigits: null,
        unitsConversionFractionDigits: -1,
        expected: "1.2346",
      },
      {
        value: 1.2,
        fractionDigits: 3,
        unitsConversionFractionDigits: 0,
        expected: "1.200",
      },
      {
        value: 1.23456,
        fractionDigits: -1,
        unitsConversionFractionDigits: 2,
        expected: "1.23",
      },
    ]

    cases.forEach(({ value, fractionDigits, unitsConversionFractionDigits, expected }) => {
      expect(formatRegularNumber(chart, value, fractionDigits, unitsConversionFractionDigits)).toBe(
        expected
      )
    })
  })

  it("keeps 18-character regular numbers and switches longer values to exponential notation", () => {
    const regularValue = 12345678901234
    const exponentialValue = 123456789012345

    expect(formatRegularNumber(chart, regularValue)).toBe("12,345,678,901,234")
    expect(formatRegularNumber(chart, regularValue)).toHaveLength(18)
    expect(shouldUseExponential(chart, regularValue)).toBe(false)
    expect(formatNumber(chart, regularValue)).toBe("12,345,678,901,234")

    expect(formatRegularNumber(chart, exponentialValue)).toBe("123,456,789,012,345")
    expect(formatRegularNumber(chart, exponentialValue)).toHaveLength(19)
    expect(shouldUseExponential(chart, exponentialValue)).toBe(true)
    expect(formatNumber(chart, exponentialValue)).toBe("1.235e+14")
  })

  it("trims insignificant trailing zeroes from exponential mantissas", () => {
    expect(formatNumber(chart, 1000000000000000000)).toBe("1e+18")
    expect(formatNumber(chart, 1200000000000000000)).toBe("1.2e+18")
  })
})
