import { packAlignedData } from "./data"
import { getVisibleRange } from "./range"

describe("WebGPU visible-window range index", () => {
  const rows = Array.from({ length: 70 }, (_, index) => [
    1000 + index * 1000,
    index,
    100 - index,
  ])
  let packed
  beforeEach(() => {
    packed = packAlignedData(rows, 2, undefined, [0, 100])
  })

  it("uses the exact global range without eagerly building the window index", () => {
    const fullPacked = packAlignedData(rows, 2, undefined, [0, 100])

    expect(
      getVisibleRange({
        packed: fullPacked,
        afterMs: 1000,
        beforeMs: 70000,
        seriesIndexes: [0, 1],
      })
    ).toEqual([0, 100])
    expect(fullPacked.rangeMin).toBeNull()
    expect(fullPacked.rangeMax).toBeNull()
  })

  it("queries exact edge values and indexed full blocks", () => {
    expect(
      getVisibleRange({
        packed,
        afterMs: 11000,
        beforeMs: 50000,
        seriesIndexes: [0],
      })
    ).toEqual([10, 49])
    expect([...packed.rangeIndexedSeries]).toEqual([1, 0])
  })

  it("combines only visible series", () => {
    expect(
      getVisibleRange({
        packed,
        afterMs: 11000,
        beforeMs: 50000,
        seriesIndexes: [1],
      })
    ).toEqual([51, 90])
    expect([...packed.rangeIndexedSeries]).toEqual([0, 1])
    expect(
      getVisibleRange({
        packed,
        afterMs: 11000,
        beforeMs: 50000,
        seriesIndexes: [0, 1],
      })
    ).toEqual([10, 90])
  })

  it("returns no range outside packed data", () => {
    expect(
      getVisibleRange({
        packed,
        afterMs: 100000,
        beforeMs: 110000,
        seriesIndexes: [0],
      })
    ).toBeNull()
  })
})
