import { packCircles } from "."

describe("WebGL2 circle packing", () => {
  it("packs DPR-scaled geometry and normalized color", () => {
    const packed = packCircles([{ x: 2, y: 3, radius: 4, color: "rgba(10, 20, 30, 0.5)" }], 2)

    expect(Array.from(packed.slice(0, 4))).toEqual([4, 6, 8, 8])
    expect(packed[8]).toBeCloseTo(10 / 255)
    expect(packed[9]).toBeCloseTo(20 / 255)
    expect(packed[10]).toBeCloseTo(30 / 255)
    expect(packed[11]).toBe(0.5)
    expect(packed[12]).toBe(1)
  })
})
