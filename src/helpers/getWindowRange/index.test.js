import getWindowRange from "./index"

describe("getWindowRange", () => {
  test.each([
    ["an empty list", 0, -1, 10, { from: 0, to: 0 }],
    ["a list shorter than the limit", 4, 3, 10, { from: 0, to: 4 }],
    ["a list equal to the limit", 10, 7, 10, { from: 0, to: 10 }],
    ["the beginning of a longer list", 12, 0, 10, { from: 0, to: 10 }],
    ["the middle of a longer list", 12, 6, 10, { from: 1, to: 11 }],
    ["the end of a longer list", 12, 11, 10, { from: 2, to: 12 }],
    ["a missing selected item", 12, -1, 10, { from: 0, to: 10 }],
    ["an odd limit", 12, 6, 7, { from: 3, to: 10 }],
  ])("returns the fixed-size range for %s", (_name, total, index, limit, expected) => {
    expect(getWindowRange({ total, index, limit })).toEqual(expected)
  })
})
