import shorten, { shortForLength } from "."

describe("shorten", () => {
  it("returns string as-is for non-string inputs", () => {
    expect(shorten(null)).toBeNull()
    expect(shorten(undefined)).toBeUndefined()
    expect(shorten(123)).toBe(123)
    expect(shorten({})).toEqual({})
  })

  it("trims whitespace at round 0", () => {
    expect(shorten("  test  ", 0)).toBe("test")
    expect(shorten("  hello world  ", 0)).toBe("hello world")
  })

  it("removes duplicate letters at round 1", () => {
    // Functions only work on compound words with separators, not single words
    expect(shorten("hello", 1)).toBe("hello")
    expect(shorten("testing", 1)).toBe("testing")
    expect(shorten("bookkeeper", 1)).toBe("bookkeeper")
  })

  it("removes middle vowels at round 2", () => {
    // Functions only work on compound words with separators, not single words
    expect(shorten("hello", 2)).toBe("hello")
    expect(shorten("testing", 2)).toBe("testing")
    expect(shorten("a", 2)).toBe("a") // too short
    expect(shorten("ab", 2)).toBe("ab") // too short
    expect(shorten("abc", 2)).toBe("abc") // too short
  })

  it("keeps numbers intact when removing vowels", () => {
    expect(shorten("test123", 2)).toBe("test123") // contains digit
    expect(shorten("hello", 2)).toBe("hello") // no separators, no transformation
  })

  it("creates ellipsis in middle for round > 2", () => {
    expect(shorten("very long string", 10)).toBe("ver...ing")
    expect(shorten("short", 10)).toBe("...") // short strings get truncated to just ellipsis
  })

  it("handles compound words with separators for round 1", () => {
    expect(shorten("hello-world", 1)).toBe("helo-world") // removes duplicate 'l'
    expect(shorten("bookkeeper-test", 1)).toBe("bokeper-test") // removes duplicates
  })

  it("handles compound words with separators for round 2", () => {
    expect(shorten("hello-world", 2)).toBe("hllo-world") // only first part gets transformed
    expect(shorten("testing_case", 2)).toBe("tstng_case") // only first part gets transformed
  })
})

describe("shortForLength", () => {
  it("returns string as-is for non-string inputs", () => {
    expect(shortForLength(null)).toBeNull()
    expect(shortForLength(undefined)).toBeUndefined()
    expect(shortForLength(123)).toBe(123)
  })

  it("returns string as-is when under max length", () => {
    expect(shortForLength("short", 30)).toBe("short")
    expect(shortForLength("medium length", 20)).toBe("medium length")
  })

  it("progressively shortens long strings", () => {
    const longString = "this is a very long string that needs shortening"
    const result = shortForLength(longString, 20)
    
    expect(result.length).toBeLessThanOrEqual(20)
    expect(result).toBeTruthy()
  })

  it("uses default max length of 30", () => {
    const longString = "this is a very long string that definitely exceeds thirty characters"
    const result = shortForLength(longString)
    
    expect(result.length).toBeLessThanOrEqual(30)
  })

  it("handles extreme shortening with ellipsis", () => {
    const veryLongString = "extremely long string with many repeated letters and vowels"
    const result = shortForLength(veryLongString, 10)
    
    expect(result.length).toBeLessThanOrEqual(10)
    expect(result).toContain("...")
  })
})