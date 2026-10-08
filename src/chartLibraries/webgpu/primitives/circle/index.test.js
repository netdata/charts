import { packCircles } from "."

describe("WebGPU circle primitive", () => {
  it("packs physical centers, radii, and colors", () => {
    const packed = packCircles([{ x: 2, y: 3, radius: 1.5, color: "#ff000080" }], 2)

    expect(Array.from(packed.slice(0, 4))).toEqual([4, 6, 3, 0])
    expect(packed[4]).toBe(1)
    expect(packed[5]).toBe(0)
    expect(packed[6]).toBe(0)
    expect(packed[7]).toBeCloseTo(128 / 255)
  })
})
