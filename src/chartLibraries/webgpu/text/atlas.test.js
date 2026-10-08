import { makeTextCacheKey } from "./atlas"

describe("WebGPU shaped-text atlas keys", () => {
  it("separates complete strings by font and device-pixel ratio", () => {
    const base = { text: "23:59:55", font: "10px sans-serif", dpr: 1 }

    expect(makeTextCacheKey(base)).not.toBe(makeTextCacheKey({ ...base, dpr: 2 }))
    expect(makeTextCacheKey(base)).not.toBe(
      makeTextCacheKey({ ...base, font: "12px sans-serif" })
    )
    expect(makeTextCacheKey(base)).not.toBe(makeTextCacheKey({ ...base, text: "23:59:56" }))
  })
})
