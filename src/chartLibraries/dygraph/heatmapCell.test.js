import makeHeatmapCell, { getHeatmapCellWidth } from "./heatmapCell"

const g = {
  toDomYCoord: index => 200 - index * 20,
  getArea: () => ({ x: 0, y: 0, w: 400, h: 200 }),
}

describe("dygraph heatmap cell", () => {
  it("is as wide as the narrowest column spacing", () => {
    const points = [{ canvasx: 10 }, { canvasx: 30 }, { canvasx: 45 }, { canvasx: 70 }]
    expect(getHeatmapCellWidth(g, points)).toBe(15)
  })

  it("spans the plot area when there is a single column", () => {
    expect(getHeatmapCellWidth(g, [{ canvasx: 10 }])).toBe(400)
    expect(getHeatmapCellWidth(g, [])).toBe(400)
  })

  it("centres the cell on its column and its row", () => {
    const getCell = makeHeatmapCell(g, [{ canvasx: 10 }, { canvasx: 30 }])
    expect(getCell(30, 2)).toEqual({ x: 20, y: 150, width: 20, height: 20 })
  })

  it("insets the cell by half the gap on every side", () => {
    const getCell = makeHeatmapCell(g, [{ canvasx: 10 }, { canvasx: 30 }], { gap: 2, ratio: 1 })
    expect(getCell(30, 2)).toEqual({ x: 21, y: 151, width: 18, height: 18 })
  })

  it("drops the gap when the cell is too narrow to show it", () => {
    const getCell = makeHeatmapCell(g, [{ canvasx: 10 }, { canvasx: 14 }], { gap: 2, ratio: 1 })
    expect(getCell(14, 2)).toMatchObject({ x: 12, width: 4, y: 151, height: 18 })
  })

  it("snaps the cell edges to device pixels", () => {
    const getCell = makeHeatmapCell(g, [{ canvasx: 10.3 }, { canvasx: 30.3 }], { ratio: 2 })
    expect(getCell(30.3, 2)).toEqual({ x: 20.5, y: 150, width: 20, height: 20 })
  })

  it("lets neighbouring cells share an edge when the column pitch is fractional", () => {
    const points = [{ canvasx: 10 }, { canvasx: 25.4 }, { canvasx: 40.8 }, { canvasx: 56.2 }]
    const getCell = makeHeatmapCell(g, points, { ratio: 1 })
    const cells = points.map(({ canvasx }) => getCell(canvasx, 0))

    cells
      .slice(1)
      .forEach((cell, index) => expect(cell.x).toBe(cells[index].x + cells[index].width))
  })
})
