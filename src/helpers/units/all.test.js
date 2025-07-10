import allUnits from "./all"

describe("allUnits", () => {
  it("exports an object with prefixes and units", () => {
    expect(typeof allUnits).toBe("object")
    expect(allUnits).not.toBe(null)
    expect(allUnits).toHaveProperty("prefixes")
  })

  it("contains standard SI prefixes", () => {
    const { prefixes } = allUnits

    expect(prefixes).toHaveProperty("Y")
    expect(prefixes).toHaveProperty("Z")
    expect(prefixes).toHaveProperty("E")
    expect(prefixes).toHaveProperty("P")
    expect(prefixes).toHaveProperty("T")
    expect(prefixes).toHaveProperty("G")
    expect(prefixes).toHaveProperty("M")
  })

  it("prefix objects have required properties", () => {
    const { prefixes } = allUnits
    const yottaPrefix = prefixes.Y

    expect(yottaPrefix).toHaveProperty("symbol")
    expect(yottaPrefix).toHaveProperty("name")
    expect(yottaPrefix).toHaveProperty("print_symbol")
    expect(yottaPrefix).toHaveProperty("value")
    expect(yottaPrefix).toHaveProperty("is_binary")

    expect(typeof yottaPrefix.symbol).toBe("string")
    expect(typeof yottaPrefix.name).toBe("string")
    expect(typeof yottaPrefix.value).toBe("number")
    expect(typeof yottaPrefix.is_binary).toBe("boolean")
  })

  it("prefixes have correct values", () => {
    const { prefixes } = allUnits

    expect(prefixes.Y.value).toBe(1e24)
    expect(prefixes.Z.value).toBe(1e21)
    expect(prefixes.E.value).toBe(1e18)
    expect(prefixes.T.value).toBe(1_000_000_000_000.0)
    expect(prefixes.G.value).toBe(1_000_000_000.0)
    expect(prefixes.M.value).toBe(1_000_000.0)
  })
})
