import makeHeatmapCell from "./heatmapCell"

const makeSelf = xs => ({
  data: [xs],
  bbox: { left: 0, top: 0, width: 800, height: 400 },
  valToPos: (value, scale) => (scale === "x" ? value * 2 : 400 - (value + 0.5) * 40),
})

describe("uplot heatmap cell", () => {
  it("is as wide as the narrowest column spacing and one row tall", () => {
    const getCell = makeHeatmapCell(makeSelf([10, 20, 25, 40]))
    expect(getCell(20, 1)).toEqual({ x: 35, y: 320, width: 10, height: 40 })
  })

  it("spans the plot when there is a single column", () => {
    const getCell = makeHeatmapCell(makeSelf([10]))
    expect(getCell(10, 0).width).toBe(800)
  })

  it("insets the cell by half the gap and drops a gap that does not fit", () => {
    const getCell = makeHeatmapCell(makeSelf([10, 20, 30]), { gap: 2 })
    expect(getCell(20, 1)).toEqual({ x: 31, y: 321, width: 18, height: 38 })

    const narrow = makeHeatmapCell(makeSelf([10, 12, 14]), { gap: 2 })
    expect(narrow(12, 1)).toMatchObject({ x: 22, width: 4, height: 38 })
  })

  it("lets neighbouring cells share an edge when the column pitch is fractional", () => {
    const xs = [10, 17.7, 25.4, 33.1]
    const getCell = makeHeatmapCell(makeSelf(xs))
    const cells = xs.map(x => getCell(x, 0))

    cells
      .slice(1)
      .forEach((cell, index) => expect(cell.x).toBe(cells[index].x + cells[index].width))
  })
})
