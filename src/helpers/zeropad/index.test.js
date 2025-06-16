import zeropad from "."

describe("zeropad", () => {
  it("adds zero prefix for single digit positive numbers", () => {
    expect(zeropad(1)).toBe("01")
    expect(zeropad(5)).toBe("05")
    expect(zeropad(9)).toBe("09")
  })

  it("adds zero prefix for single digit negative numbers", () => {
    expect(zeropad(-1)).toBe("0-1")
    expect(zeropad(-5)).toBe("0-5")
    expect(zeropad(-9)).toBe("0-9")
  })

  it("does not add zero prefix for double digit numbers", () => {
    expect(zeropad(10)).toBe("10")
    expect(zeropad(25)).toBe("25")
    expect(zeropad(99)).toBe("99")
  })

  it("does not add zero prefix for negative double digit numbers", () => {
    expect(zeropad(-10)).toBe("-10")
    expect(zeropad(-25)).toBe("-25")
    expect(zeropad(-99)).toBe("-99")
  })

  it("handles zero", () => {
    expect(zeropad(0)).toBe("00")
  })

  it("handles large numbers", () => {
    expect(zeropad(100)).toBe("100")
    expect(zeropad(1000)).toBe("1000")
    expect(zeropad(-100)).toBe("-100")
  })
})