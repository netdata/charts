import { parseColor } from "./color"

describe("WebGPU color conversion", () => {
  it("preserves transparent CSS colors", () => {
    expect(parseColor("transparent")).toEqual([0, 0, 0, 0])
  })

  it("resolves browser-shaped CSS colors outside the packed fast paths", () => {
    expect(parseColor("rebeccapurple")).toEqual([102 / 255, 51 / 255, 153 / 255, 1])
  })
})
