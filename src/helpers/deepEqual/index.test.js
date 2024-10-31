import deepEqual, { filter, setsAreEqual } from "."

it("#setsAreEqual should return true if sets are equal", () => {
  const a = new Set([1, 2, 3])
  const b = new Set([1, 2, 3])

  expect(setsAreEqual(a, b)).toBe(true)
})

it("#filter should return an array with the elements that are not in the omit list", () => {
  const arr = ["a", "b", "c", "d"]

  expect(filter(arr, { omit: ["a", "b"] })).toEqual(["c", "d"])
})

it("should return true if objects are equal", () => {
  const objA = { a: 1, b: 2, c: 3 }
  const objB = { a: 1, b: 2, c: 3 }

  expect(deepEqual(objA, objB)).toBe(true)
})
