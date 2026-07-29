import { placeRasterizedText, placeText } from "."

describe("GPU text placement", () => {
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

  it.each([1, 1.25, 1.5, 2])(
    "places exact atlas pixels at DPR %s without fractional scaling",
    dpr => {
      const pixelWidth = Math.ceil(43 * dpr)
      const pixelHeight = Math.ceil(15 * dpr)
      const placement = placeRasterizedText({
        label: {
          x: 100,
          y: 40,
          align: "right",
          verticalAlign: "middle",
        },
        entry: { pixelWidth, pixelHeight },
        dpr,
      })

      expect(placement.width).toBe(pixelWidth)
      expect(placement.height).toBe(pixelHeight)
      expect(Number.isInteger(placement.x)).toBe(true)
      expect(Number.isInteger(placement.y)).toBe(true)
    }
  )
})
