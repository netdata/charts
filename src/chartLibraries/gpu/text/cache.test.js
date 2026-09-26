import makeBoundedCache from "./cache"

describe("WebGPU text atlas cache", () => {
  it("signals a generation reset before admitting more unique shaped strings", () => {
    const cache = makeBoundedCache(2)
    cache.set("1|10px sans-serif|first", { id: 1 })
    cache.set("1|10px sans-serif|second", { id: 2 })

    expect(cache.isFullFor("1|10px sans-serif|first")).toBe(false)
    expect(cache.isFullFor("2|10px sans-serif|first")).toBe(true)
    expect(cache.size).toBe(2)

    cache.clear()
    expect(cache.size).toBe(0)
    expect(cache.isFullFor("2|10px sans-serif|first")).toBe(false)
  })
})
