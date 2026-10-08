import { packRects } from "."

describe("WebGL2 rectangle packing", () => {
  it("packs DPR-scaled geometry and normalized color", () => {
    const packed = packRects([{ x: 1, y: 2, width: 3, height: 4, color: "#ff800080" }], 2)

    expect(Array.from(packed.slice(0, 4))).toEqual([2, 4, 6, 8])
    expect(packed[8]).toBe(1)
    expect(packed[9]).toBeCloseTo(128 / 255)
    expect(packed[10]).toBe(0)
    expect(packed[11]).toBeCloseTo(128 / 255)
    expect(packed[12]).toBe(0)
  })
})
