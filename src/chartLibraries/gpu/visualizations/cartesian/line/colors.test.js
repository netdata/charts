import { parseColor } from "./colors"

describe("WebGPU series colors", () => {
  it("packs short and full hexadecimal colors", () => {
    expect(parseColor("#369")).toEqual([0.2, 0.4, 0.6, 1])
    expect(parseColor("#33669980")).toEqual([0.2, 0.4, 0.6, 128 / 255])
  })

  it("packs rgb and rgba colors", () => {
    expect(parseColor("rgb(51, 102, 153)")).toEqual([0.2, 0.4, 0.6, 1])
    expect(parseColor("rgba(51, 102, 153, 0.5)")).toEqual([0.2, 0.4, 0.6, 0.5])
  })
})
