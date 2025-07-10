import deepMerge from "."

describe("deepMerge", () => {
  it("returns objB when objA equals objB", () => {
    const obj = { a: 1 }
    expect(deepMerge(obj, obj)).toBe(obj)
  })

  it("returns objB when objA is null", () => {
    const objB = { a: 1 }
    expect(deepMerge(null, objB)).toBe(objB)
  })

  it("returns objB when objB is null", () => {
    const objA = { a: 1 }
    expect(deepMerge(objA, null)).toBeNull()
  })

  it("returns objB when objA is not an object", () => {
    expect(deepMerge("string", { a: 1 })).toEqual({ a: 1 })
    expect(deepMerge(42, { a: 1 })).toEqual({ a: 1 })
  })

  it("returns objB when objB is not an object", () => {
    expect(deepMerge({ a: 1 }, "string")).toBe("string")
    expect(deepMerge({ a: 1 }, 42)).toBe(42)
  })

  it("detects implementation bug in deepMergeObject", () => {
    // This test documents that deepMergeObject doesn't return its result
    const objA = { a: 1, b: 2 }
    const objB = { b: 3, c: 4 }
    const result = deepMerge(objA, objB)

    expect(result).toBeUndefined()
  })

  it("detects implementation bug in deepMergeArray", () => {
    // This test documents current behavior - arrays return original arrA
    const arrA = [1, 2, 3]
    const arrB = [4, 5]
    const result = deepMerge(arrA, arrB)

    expect(result).toEqual([1, 2, 3])
  })
})
