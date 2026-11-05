import { getDivergingBarRect } from "./stackedBar"

describe("diverging stacked bar geometry", () => {
  const toDomYCoord = value => 100 - value * 10

  it("draws positive values from their positive stack baseline", () => {
    const point = { canvasx: 20, netdataStackBase: 2, netdataStackEnd: 5 }

    expect(getDivergingBarRect(point, 10, toDomYCoord)).toEqual({
      x: 15,
      y: 50,
      width: 10,
      height: 30,
    })
  })

  it("draws negative values from their negative stack baseline", () => {
    const point = { canvasx: 20, netdataStackBase: -1, netdataStackEnd: -4 }

    expect(getDivergingBarRect(point, 10, toDomYCoord)).toEqual({
      x: 15,
      y: 110,
      width: 10,
      height: 30,
    })
  })

  it("ignores points without diverging stack bounds", () => {
    expect(getDivergingBarRect({ canvasx: 20 }, 10, toDomYCoord)).toBeNull()
  })
})
