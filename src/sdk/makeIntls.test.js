import makeIntls, { resolveXAxisTimeStyle } from "./makeIntls"

const RealIntl = Intl

describe("makeIntls", () => {
  let mockNavigator

  beforeEach(() => {
    mockNavigator = {
      language: "en-US",
    }
    Object.defineProperty(global, "navigator", {
      value: mockNavigator,
      configurable: true,
    })

    global.Intl = {
      DateTimeFormat: jest.fn(() => ({
        format: jest.fn(date => "formatted-date"),
      })),
    }
  })

  it("creates intl formatters object", () => {
    const intls = makeIntls()

    expect(intls).toHaveProperty("update")
    expect(intls).toHaveProperty("formatTime")
    expect(intls).toHaveProperty("formatDate")
    expect(intls).toHaveProperty("formatXAxis")
    expect(intls).toHaveProperty("destroy")
  })

  it("updates timezone", () => {
    const intls = makeIntls()

    expect(() => intls.update("UTC")).not.toThrow()
    expect(global.Intl.DateTimeFormat).toHaveBeenCalled()
  })

  it("formats time", () => {
    const intls = makeIntls()
    intls.update("UTC")

    const result = intls.formatTime(new Date())
    expect(result).toBe("formatted-date")
  })

  it("formats date", () => {
    const intls = makeIntls()
    intls.update("UTC")

    const result = intls.formatDate(new Date())
    expect(result).toBe("formatted-date")
  })

  it("formats X axis for midnight", () => {
    const intls = makeIntls()
    intls.update("UTC")

    const midnight = new Date("2023-01-01T00:00:00Z")
    const result = intls.formatXAxis(midnight)
    expect(result).toBe("formatted-date")
  })

  it("formats X axis for non-midnight", () => {
    const intls = makeIntls()
    intls.update("UTC")

    const nonMidnight = new Date("2023-01-01T12:30:45Z")
    const result = intls.formatXAxis(nonMidnight)
    expect(result).toBe("formatted-date")
  })

  it("falls back to native formatters on error", () => {
    global.Intl.DateTimeFormat = jest.fn(() => {
      throw new Error("Intl error")
    })

    const intls = makeIntls()
    intls.update("UTC")

    expect(() => intls.formatTime(new Date())).not.toThrow()
    expect(() => intls.formatDate(new Date())).not.toThrow()
  })

  it("destroys formatters", () => {
    const intls = makeIntls()

    expect(() => intls.destroy()).not.toThrow()
  })
})

describe("makeIntls x-axis time style", () => {
  const afternoon = new Date("2023-01-01T12:30:45Z")

  beforeEach(() => {
    global.Intl = RealIntl
  })

  const makeUtcIntls = () => {
    const intls = makeIntls()
    intls.update("UTC", "en-US")
    return intls
  }

  it("keeps seconds by default", () => {
    expect(makeUtcIntls().formatXAxis(afternoon)).toBe("12:30:45")
  })

  it("keeps seconds for the medium style", () => {
    expect(makeUtcIntls().formatXAxis(afternoon, "medium")).toBe("12:30:45")
  })

  it("drops seconds for the short style", () => {
    expect(makeUtcIntls().formatXAxis(afternoon, "short")).toBe("12:30")
  })

  it("shows the date at midnight for the short style", () => {
    const midnight = new Date("2023-01-02T00:00:00Z")
    const intls = makeUtcIntls()

    expect(intls.formatXAxis(midnight, "short")).toBe(intls.formatXAxis(midnight))
    expect(intls.formatXAxis(midnight, "short")).toBe("01/02")
  })

  it("drops seconds for the short style with native formatters", () => {
    global.Intl = {
      DateTimeFormat: jest.fn(() => {
        throw new Error("Intl error")
      }),
    }
    const intls = makeIntls()
    intls.update("UTC")

    expect(intls.formatXAxis(new Date(2023, 0, 1, 12, 30, 45), "short")).toBe("12:30")
  })

  it("resolves the auto style from the tick spacing", () => {
    expect(resolveXAxisTimeStyle("auto", true)).toBe("medium")
    expect(resolveXAxisTimeStyle("auto", false)).toBe("short")
  })

  it("keeps explicit and unset styles regardless of the tick spacing", () => {
    expect(resolveXAxisTimeStyle("short", true)).toBe("short")
    expect(resolveXAxisTimeStyle("medium", false)).toBe("medium")
    expect(resolveXAxisTimeStyle(undefined, false)).toBe("medium")
  })
})
