import {
  toFraction,
  fractionToAngle,
  startAngle,
  endAngle,
  arcPath,
  sumRow,
  sparklinePath,
  trendBox,
  legibleSize,
  radius,
  valueRadius,
  valueBaseline,
  valueTextBox,
  fitValueFontSize,
  unitFontSize,
} from "./geometry"

const topCornerDistance = (value, unit, size) => {
  const { width, height } = valueTextBox(value, unit, size)
  return Math.hypot(width / 2, valueBaseline + height)
}

describe("modern gauge geometry", () => {
  it("maps values into the range and clamps outside it", () => {
    expect(toFraction(50, 0, 100)).toBe(0.5)
    expect(toFraction(-10, 0, 100)).toBe(0)
    expect(toFraction(150, 0, 100)).toBe(1)
    expect(toFraction(15, 10, 20)).toBe(0.5)
  })

  it("returns zero for an empty range or a missing value", () => {
    expect(toFraction(5, 10, 10)).toBe(0)
    expect(toFraction(null, 0, 100)).toBe(0)
    expect(toFraction(5, null, null)).toBe(0)
    expect(toFraction(NaN, 0, 100)).toBe(0)
  })

  it("spans 240 degrees", () => {
    expect(fractionToAngle(0)).toBe(startAngle)
    expect(fractionToAngle(1)).toBeCloseTo(endAngle)
    expect(((endAngle - startAngle) * 180) / Math.PI).toBeCloseTo(240)
  })

  it("uses the large arc flag only past 180 degrees", () => {
    expect(arcPath(0, 0, 10, 0, Math.PI / 2)).toContain(" 0 0 1 ")
    expect(arcPath(0, 0, 10, startAngle, endAngle)).toContain(" 0 1 1 ")
  })

  it("sums a data row the same way the canvas gauge does", () => {
    expect(sumRow([1000, 1, 2, 3])).toBe(6)
    expect(sumRow([1000, 1, null, 2])).toBe(3)
    expect(sumRow(undefined)).toBeNull()
  })

  it("builds a sparkline only from two or more numbers", () => {
    expect(sparklinePath([1], { width: 10, height: 10 })).toEqual({ line: "", area: "" })
    const { line, area } = sparklinePath([0, 5, 10], { width: 100, height: 20, pad: 0 })
    expect(line).toBe("M0.00,20.00 L50.00,10.00 L100.00,0.00")
    expect(area).toBe(`${line} L100,20 L0,20 Z`)
  })

  it("returns the first and last points for the trend dots", () => {
    const { start, end } = sparklinePath([0, 5, 10], { width: 100, height: 20, pad: 0 })
    expect(start).toEqual([0, 20])
    expect(end).toEqual([100, 0])
  })

  it("keeps the trend at its design size on a full-size gauge", () =>
    expect(trendBox(1)).toEqual({ width: 150, height: 44 }))

  it("shrinks the trend height faster than the tile", () => {
    const { width, height } = trendBox(0.6)
    expect(width).toBeLessThan(150)
    expect(height / 44).toBeLessThan(0.6)
    expect(height).toBeGreaterThanOrEqual(18)
  })

  it("keeps text at least 11px on screen", () => {
    expect(legibleSize(17, 1)).toBe(17)
    expect(legibleSize(17, 0.5)).toBe(22)
    expect(legibleSize(17, 0)).toBe(17)
  })

  it("handles a flat series without dividing by zero", () => {
    const { line } = sparklinePath([3, 3, 3], { width: 10, height: 10, pad: 0 })
    expect(line).not.toContain("NaN")
  })

  it("keeps the design size for short readouts", () => {
    expect(fitValueFontSize("42.1", "%")).toBe(44)
    expect(unitFontSize(44)).toBe(16)
  })

  it("shrinks long readouts so the number stays inside the arc", () => {
    const cases = [
      ["42.1", "load"],
      ["1,234,567", "requests/s"],
      ["99.9876", "%"],
      ["12,345.6789", "kilobits/s"],
      ["-1,234,567,890", ""],
    ]

    cases.forEach(([value, unit]) => {
      const size = fitValueFontSize(value, unit)
      expect(size).toBeLessThanOrEqual(44)
      expect(topCornerDistance(value, unit, size)).toBeLessThanOrEqual(valueRadius)
      if (size < 44) expect(topCornerDistance(value, unit, size + 1)).toBeGreaterThan(valueRadius)
    })

    expect(fitValueFontSize("1,234,567", "requests/s")).toBeLessThan(fitValueFontSize("42", ""))
  })

  it("clears the knob that rides on the arc", () => {
    const knobInnerEdge = radius - 7 - 1.5
    expect(valueRadius).toBeLessThan(knobInnerEdge)
  })
})
