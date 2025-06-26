import { getValue, setValue, deleteKey, flattenObject } from "./crud"

describe("getValue", () => {
  const testObj = {
    simple: "value",
    nested: {
      level1: {
        level2: "deep value"
      },
      array: [1, 2, 3],
      number: 42
    },
    drawer: {
      action: "values",
      tab: "window",
      showAdvancedStats: false
    }
  }

  it("returns simple values", () => {
    expect(getValue("simple", "default", testObj)).toBe("value")
  })

  it("returns nested values", () => {
    expect(getValue("nested.level1.level2", "default", testObj)).toBe("deep value")
    expect(getValue("nested.number", "default", testObj)).toBe(42)
  })

  it("returns default for non-existent paths", () => {
    expect(getValue("nonexistent", "default", testObj)).toBe("default")
    expect(getValue("nested.nonexistent", "default", testObj)).toBe("default")
    expect(getValue("nested.level1.nonexistent", "default", testObj)).toBe("default")
  })

  it("returns default for null/undefined intermediate values", () => {
    const objWithNulls = {
      a: null,
      b: undefined,
      c: { d: null }
    }
    
    expect(getValue("a.b", "default", objWithNulls)).toBe("default")
    expect(getValue("b.c", "default", objWithNulls)).toBe("default")
    expect(getValue("c.d.e", "default", objWithNulls)).toBe("default")
  })

  it("handles edge cases", () => {
    expect(getValue("", "default", testObj)).toBe("default")
    expect(getValue(null, "default", testObj)).toBe("default")
    expect(getValue(undefined, "default", testObj)).toBe("default")
    expect(getValue("simple", "default", null)).toBe("default")
    expect(getValue("simple", "default", undefined)).toBe("default")
  })

  it("handles drawer-specific attributes", () => {
    expect(getValue("drawer.action", "default", testObj)).toBe("values")
    expect(getValue("drawer.tab", "default", testObj)).toBe("window")
    expect(getValue("drawer.showAdvancedStats", true, testObj)).toBe(false)
  })

  it("returns undefined values as default", () => {
    const objWithUndefined = { a: undefined }
    expect(getValue("a", "default", objWithUndefined)).toBe("default")
  })

  it("handles arrays as intermediate values", () => {
    expect(getValue("nested.array.0", "default", testObj)).toBe(1)
  })
})

describe("setValue", () => {
  it("sets simple values", () => {
    const obj = {}
    setValue("simple", "value", obj)
    expect(obj.simple).toBe("value")
  })

  it("sets nested values", () => {
    const obj = {}
    setValue("nested.level1.level2", "deep value", obj)
    expect(obj.nested.level1.level2).toBe("deep value")
  })

  it("creates missing parent objects", () => {
    const obj = {}
    setValue("a.b.c.d", "value", obj)
    expect(obj.a.b.c.d).toBe("value")
    expect(typeof obj.a).toBe("object")
    expect(typeof obj.a.b).toBe("object")
    expect(typeof obj.a.b.c).toBe("object")
  })

  it("overwrites existing values", () => {
    const obj = { existing: "old" }
    setValue("existing", "new", obj)
    expect(obj.existing).toBe("new")
  })

  it("handles drawer-specific attributes", () => {
    const obj = {}
    setValue("drawer.action", "values", obj)
    setValue("drawer.tab", "window", obj)
    setValue("drawer.showAdvancedStats", true, obj)
    
    expect(obj.drawer.action).toBe("values")
    expect(obj.drawer.tab).toBe("window")
    expect(obj.drawer.showAdvancedStats).toBe(true)
  })

  it("overwrites existing nested objects", () => {
    const obj = { drawer: { action: "old" } }
    setValue("drawer.action", "new", obj)
    expect(obj.drawer.action).toBe("new")
  })

  it("handles edge cases", () => {
    const obj = {}
    setValue("", "value", obj)
    setValue(null, "value", obj)
    setValue(undefined, "value", obj)
    expect(Object.keys(obj)).toHaveLength(0)
  })
})

describe("deleteKey", () => {
  it("deletes simple properties", () => {
    const obj = { simple: "value", keep: "me" }
    deleteKey("simple", obj)
    expect(obj).toEqual({ keep: "me" })
  })

  it("deletes nested properties", () => {
    const obj = {
      drawer: {
        action: "values",
        tab: "window",
        showAdvancedStats: true
      }
    }
    deleteKey("drawer.showAdvancedStats", obj)
    expect(obj.drawer).toEqual({
      action: "values",
      tab: "window"
    })
  })

  it("deletes deeply nested properties", () => {
    const obj = {
      a: {
        b: {
          c: "delete me",
          d: "keep me"
        }
      }
    }
    deleteKey("a.b.c", obj)
    expect(obj.a.b).toEqual({ d: "keep me" })
  })

  it("handles non-existent paths gracefully", () => {
    const obj = { existing: "value" }
    deleteKey("nonexistent", obj)
    deleteKey("existing.nonexistent", obj)
    expect(obj).toEqual({ existing: "value" })
  })

  it("handles edge cases", () => {
    const obj = { test: "value" }
    deleteKey("", obj)
    deleteKey(null, obj)
    deleteKey(undefined, obj)
    expect(obj).toEqual({ test: "value" })
  })

  it("preserves other nested properties", () => {
    const obj = {
      drawer: {
        action: "values",
        tab: "window",
        nested: {
          deep: "value",
          another: "prop"
        }
      }
    }
    deleteKey("drawer.nested.deep", obj)
    expect(obj.drawer.nested).toEqual({ another: "prop" })
    expect(obj.drawer.action).toBe("values")
    expect(obj.drawer.tab).toBe("window")
  })
})

describe("flattenObject", () => {
  it("flattens simple nested objects", () => {
    const obj = {
      drawer: {
        action: "values",
        tab: "window"
      }
    }
    const result = flattenObject(obj)
    expect(result).toEqual({
      "drawer.action": "values",
      "drawer.tab": "window"
    })
  })

  it("flattens deeply nested objects", () => {
    const obj = {
      a: {
        b: {
          c: "deep"
        }
      }
    }
    const result = flattenObject(obj)
    expect(result).toEqual({
      "a.b.c": "deep"
    })
  })

  it("handles mixed flat and nested properties", () => {
    const obj = {
      simple: "value",
      nested: {
        prop: "nested value"
      }
    }
    const result = flattenObject(obj)
    expect(result).toEqual({
      "simple": "value",
      "nested.prop": "nested value"
    })
  })

  it("handles arrays as values", () => {
    const obj = {
      drawer: {
        items: [1, 2, 3]
      }
    }
    const result = flattenObject(obj)
    expect(result).toEqual({
      "drawer.items": [1, 2, 3]
    })
  })

  it("handles null and undefined values", () => {
    const obj = {
      drawer: {
        nullValue: null,
        undefinedValue: undefined
      }
    }
    const result = flattenObject(obj)
    expect(result).toEqual({
      "drawer.nullValue": null,
      "drawer.undefinedValue": undefined
    })
  })

  it("returns empty object for empty input", () => {
    expect(flattenObject({})).toEqual({})
  })
})