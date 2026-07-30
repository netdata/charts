import { makeTextureLayout } from "./textures"

describe("WebGL2 line texture layout", () => {
  it("retains exact values when the texture is full", () => {
    const values = new Float32Array([1, 2, 3, 4])
    const layout = makeTextureLayout(values, 1, 2)

    expect(layout).toEqual({ width: 2, height: 2, values })
  })

  it("pads only the unused tail of a rectangular texture", () => {
    const values = new Float32Array([1, 2, 3, 4, 5])
    const layout = makeTextureLayout(values, 1, 4)

    expect(layout.width).toBe(4)
    expect(layout.height).toBe(2)
    expect([...layout.values]).toEqual([1, 2, 3, 4, 5, 0, 0, 0])
  })

  it("rejects values beyond the available texture capacity", () => {
    expect(() => makeTextureLayout(new Float32Array(5), 1, 2)).toThrow(
      /texture capacity exceeded/
    )
  })
})
