import { placeText } from "."

describe("WebGPU text placement", () => {
  it("places centered and bottom-aligned shaped strings", () => {
    expect(
      placeText({
        x: 50,
        y: 40,
        width: 20,
        height: 10,
        align: "center",
        verticalAlign: "bottom",
      })
    ).toEqual({ x: 40, y: 30, width: 20, height: 10 })
  })

  it("keeps top-left placement unchanged", () => {
    expect(placeText({ x: 4, y: 8, width: 12, height: 6 })).toEqual({
      x: 4,
      y: 8,
      width: 12,
      height: 6,
    })
  })
})
