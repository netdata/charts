import { getArea } from "./overlayArea"

const stubChartUI = ({ windowMs, coordOf }) => ({
  getXAxisRange: () => windowMs,
  getXCoord: tsMs => coordOf(tsMs),
})

describe("overlayArea getArea", () => {
  it("maps an in-window range to from/to/width via getXCoord", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => (tsMs - 1000000) / 1000,
    })

    const area = getArea(chartUI, [1200, 1800])

    expect(area).toEqual({ from: 200, to: 800, width: 600 })
  })

  it("clamps a range that overhangs the window to the window edges", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => (tsMs - 1000000) / 1000,
    })

    const area = getArea(chartUI, [500, 1800])

    expect(area).toEqual({ from: 0, to: 800, width: 800 })
  })

  it("returns null when the range is entirely outside the window", () => {
    const chartUI = stubChartUI({
      windowMs: [1000000, 2000000],
      coordOf: tsMs => tsMs,
    })

    expect(getArea(chartUI, [10, 20])).toBeNull()
  })
})
