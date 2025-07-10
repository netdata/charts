import Badge, { getColors } from "./badge"

describe("Badge component", () => {
  it("exports Badge component", () => {
    expect(Badge).toBeDefined()
    expect(typeof Badge).toBe("function")
  })

  it("exports getColors function", () => {
    expect(getColors).toBeDefined()
    expect(typeof getColors).toBe("function")
  })
})

describe("getColors function", () => {
  it("returns error colors for error type", () => {
    const colors = getColors("error")

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns warning colors for warning type", () => {
    const colors = getColors("warning")

    expect(colors).toEqual({
      background: "warningBackground",
      color: "warningText",
    })
  })

  it("returns success colors for success type", () => {
    const colors = getColors("success")

    expect(colors).toEqual({
      background: ["green", "frostee"],
      color: "success",
    })
  })

  it("returns neutral colors for neutral type", () => {
    const colors = getColors("neutral")

    expect(colors).toEqual({
      background: "elementBackground",
      color: "textLite",
    })
  })

  it("returns error colors for unknown type", () => {
    const colors = getColors("unknown")

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns error colors for undefined type", () => {
    const colors = getColors(undefined)

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })

  it("returns error colors for null type", () => {
    const colors = getColors(null)

    expect(colors).toEqual({
      background: "errorBackground",
      color: "errorText",
    })
  })
})
