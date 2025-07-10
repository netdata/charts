import limitRange from "./index"

describe("limitRange", () => {
  it("keeps range when duration exceeds minimum", () => {
    const range = { after: 100, before: 200 }
    const result = limitRange(range)

    expect(result).toEqual({
      fixedAfter: 100,
      fixedBefore: 200,
    })
  })

  it("expands range when duration is less than minimum", () => {
    const range = { after: 100, before: 130 }
    const result = limitRange(range)

    expect(result.fixedBefore - result.fixedAfter).toBe(60)
    expect(result.fixedAfter).toBeLessThan(100)
    expect(result.fixedBefore).toBeGreaterThan(130)
  })

  it("handles even duration expansion", () => {
    const range = { after: 100, before: 150 }
    const result = limitRange(range)

    expect(result).toEqual({
      fixedAfter: 95,
      fixedBefore: 155,
    })
  })

  it("handles odd duration expansion", () => {
    const range = { after: 100, before: 149 }
    const result = limitRange(range)

    expect(result).toEqual({
      fixedAfter: 93.5,
      fixedBefore: 154.5,
    })
  })

  it("uses default before value of 0", () => {
    const range = { after: -30 }
    const result = limitRange(range)

    expect(result.fixedBefore - result.fixedAfter).toBe(60)
  })

  it("handles minimum duration exactly", () => {
    const range = { after: 0, before: 60 }
    const result = limitRange(range)

    expect(result).toEqual({
      fixedAfter: 0,
      fixedBefore: 60,
    })
  })
})
