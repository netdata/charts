import { packRects } from "."

describe("WebGPU rectangle primitive", () => {
  it("packs physical geometry and color without mutating input", () => {
    const rects = [{ x: 1, y: 2, width: 3, height: 4, color: "rgba(10, 20, 30, 0.5)" }]

    const packed = packRects(rects, 2)
    expect(Array.from(packed.slice(0, 4))).toEqual([2, 4, 6, 8])
    expect(packed[4]).toBeCloseTo(10 / 255)
    expect(packed[5]).toBeCloseTo(20 / 255)
    expect(packed[6]).toBeCloseTo(30 / 255)
    expect(packed[7]).toBe(0.5)
    expect(rects).toEqual([
      { x: 1, y: 2, width: 3, height: 4, color: "rgba(10, 20, 30, 0.5)" },
    ])
  })
})
