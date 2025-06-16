import dimensionColors from "./dimensionColors"

describe("dimensionColors", () => {
  it("exports an array of color pairs", () => {
    expect(Array.isArray(dimensionColors)).toBe(true)
    expect(dimensionColors.length).toBeGreaterThan(0)
  })

  it("contains color pair arrays", () => {
    dimensionColors.forEach(colorPair => {
      expect(Array.isArray(colorPair)).toBe(true)
      expect(colorPair).toHaveLength(2)
    })
  })

  it("contains valid hex color strings", () => {
    const hexColorRegex = /^#[0-9A-F]{6}$/i

    dimensionColors.forEach(colorPair => {
      colorPair.forEach(color => {
        expect(typeof color).toBe("string")
        expect(color).toMatch(hexColorRegex)
      })
    })
  })

  it("has consistent color pairs count", () => {
    expect(dimensionColors.length).toBe(20)
  })

  it("first color pair is correct", () => {
    expect(dimensionColors[0]).toEqual(["#3366CC", "#66AA00"])
  })
})