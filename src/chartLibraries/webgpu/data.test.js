import { packAlignedData } from "./data"

describe("WebGPU aligned payload packing", () => {
  it("packs shared timestamp offsets and dimension-major values", () => {
    const rows = [
      [1783630694000, 1, 10],
      [1783630695000, 2, 20],
      [1783630696000, 3, 30],
    ]

    const packed = packAlignedData(rows, 2)

    expect(packed.xOriginMs).toBe(1783630694000)
    expect([...packed.x]).toEqual([0, 1, 2])
    expect([...packed.y]).toEqual([1, 2, 3, 10, 20, 30])
    expect(packed.pointCount).toBe(3)
    expect(packed.seriesCount).toBe(2)
    expect(packed.byteLength).toBe(packed.x.byteLength + packed.y.byteLength)
  })

  it("preserves millisecond timestamp precision after removing the epoch origin", () => {
    const packed = packAlignedData(
      [
        [1783630694000, 1],
        [1783630694001, 2],
        [1783630694002, 3],
      ],
      1
    )

    expect(packed.x[1]).toBeCloseTo(0.001, 7)
    expect(packed.x[2]).toBeCloseTo(0.002, 7)
  })

  it("extracts values from compact JSON2 point-schema cells", () => {
    const packed = packAlignedData(
      [
        [1000, [1, 10], { value: 3, arp: 30 }],
        [2000, [2, 20], { value: 4, arp: 40 }],
      ],
      2,
      { value: 0, arp: 1 }
    )

    expect([...packed.y]).toEqual([1, 2, 3, 4])
  })

  it("encodes null and undefined values as GPU gap markers", () => {
    const packed = packAlignedData(
      [
        [1000, null, 1],
        [2000, undefined, 2],
      ],
      2
    )

    expect(Number.isNaN(packed.y[0])).toBe(true)
    expect(Number.isNaN(packed.y[1])).toBe(true)
    expect([...packed.y.slice(2)]).toEqual([1, 2])
  })

  it("does not mutate the public row-major payload", () => {
    const rows = [
      [1000, 1],
      [2000, 2],
    ]
    const original = rows.map(row => [...row])

    packAlignedData(rows, 1)

    expect(rows).toEqual(original)
  })
})
