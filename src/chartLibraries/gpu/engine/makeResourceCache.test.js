import makeResourceCache from "./makeResourceCache"

describe("GPU runtime resource cache", () => {
  it("creates a shared resource once and reports its bytes", async () => {
    const cache = makeResourceCache()
    let creations = 0
    const create = () => {
      creations += 1
      return { getGPUBytes: () => 4096, destroy: () => {} }
    }

    const first = await cache.get("atlas", create)
    const second = await cache.get("atlas", create)

    expect(second).toBe(first)
    expect(creations).toBe(1)
    expect(cache.getBytes()).toBe(4096)
  })

  it("destroys resolved resources", async () => {
    const cache = makeResourceCache()
    let destroyed = false
    await cache.get("atlas", () => ({
      destroy: () => {
        destroyed = true
      },
    }))

    cache.destroy()

    expect(destroyed).toBe(true)
    expect(cache.getBytes()).toBe(0)
  })
})
