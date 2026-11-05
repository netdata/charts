import lightenColor from "./makeGradientColors"

describe("lightenColor", () => {
  it("returns a valid hex color", () => {
    expect(lightenColor("#00AB44")).toMatch(/^#[0-9a-f]{6}$/i)
  })

  it("returns a lighter version of the input color", () => {
    expect(lightenColor("#00AB44")).not.toBe("#00AB44")
  })

  it("returns the original color with factor 0", () => {
    expect(lightenColor("#00AB44", 0)).toBe("#00ab44")
  })

  it("returns white with factor 1", () => {
    expect(lightenColor("#00AB44", 1)).toBe("#ffffff")
  })

  it("returns white for black with factor 1", () => {
    expect(lightenColor("#000000", 1)).toBe("#ffffff")
  })

  it("respects custom factor", () => {
    const light = lightenColor("#000000", 0.5)
    expect(light).toBe("#808080")
  })
})
