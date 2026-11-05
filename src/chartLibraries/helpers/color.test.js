import { darkenColor, withAlpha } from "./color"

describe("darkenColor", () => {
  it("darkens RGB color strings", () => {
    const result = darkenColor("rgb(100, 150, 200)")
    expect(result).toBe("rgb(177,202,227)")
  })

  it("darkens hex colors", () => {
    const result = darkenColor("#ff0000")
    expect(result).toBe("rgb(255,127,127)")
  })

  it("darkens blue hex color", () => {
    const result = darkenColor("#0000ff")
    expect(result).toBe("rgb(127,127,255)")
  })

  it("handles black color", () => {
    const result = darkenColor("#000000")
    expect(result).toBe("rgb(127,127,127)")
  })

  it("handles white color", () => {
    const result = darkenColor("#ffffff")
    expect(result).toBe("rgb(255,255,255)")
  })

  it("handles edge case with rgb(0,0,0)", () => {
    const result = darkenColor("rgb(0,0,0)")
    expect(result).toBe("rgb(127,127,127)")
  })
})

describe("withAlpha", () => {
  it("applies an alpha to hex and rgb colours", () => {
    expect(withAlpha("#3366CC", 0.8)).toBe("rgba(51,102,204,0.8)")
    expect(withAlpha("#36c", 0.25)).toBe("rgba(51,102,204,0.25)")
    expect(withAlpha("rgb(220, 57, 18)", 0.4)).toBe("rgba(220,57,18,0.4)")
  })
})
