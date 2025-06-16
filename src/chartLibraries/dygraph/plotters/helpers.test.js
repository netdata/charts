import { darkenColor } from "./helpers"

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