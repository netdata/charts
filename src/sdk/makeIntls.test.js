import makeIntls from "./makeIntls"

describe("makeIntls", () => {
  let mockNavigator

  beforeEach(() => {
    mockNavigator = {
      language: "en-US"
    }
    Object.defineProperty(global, "navigator", {
      value: mockNavigator,
      configurable: true
    })

    global.Intl = {
      DateTimeFormat: jest.fn(() => ({
        format: jest.fn(date => "formatted-date")
      }))
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
    expect(global.Intl.DateTimeFormat).toBeCalled()
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