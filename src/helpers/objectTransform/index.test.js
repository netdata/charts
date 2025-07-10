import {
  uppercase,
  camelToUnderscore,
  underscoreToCamel,
  objectTransformator,
  underscoredKeys,
  camelizeKeys,
} from "."

describe("objectTransform helpers", () => {
  describe("uppercase", () => {
    it("capitalizes first letter", () => {
      expect(uppercase("hello")).toBe("Hello")
      expect(uppercase("test")).toBe("Test")
      expect(uppercase("a")).toBe("A")
    })

    it("handles empty string", () => {
      expect(uppercase("")).toBe("")
    })
  })

  describe("camelToUnderscore", () => {
    it("converts camelCase to underscore_case", () => {
      expect(camelToUnderscore("camelCase")).toBe("camel_case")
      expect(camelToUnderscore("XMLHttpRequest")).toBe("_x_m_l_http_request")
      expect(camelToUnderscore("getUserData")).toBe("get_user_data")
    })

    it("handles strings without capitals", () => {
      expect(camelToUnderscore("lowercase")).toBe("lowercase")
      expect(camelToUnderscore("test")).toBe("test")
    })
  })

  describe("underscoreToCamel", () => {
    it("converts underscore_case to camelCase", () => {
      expect(underscoreToCamel("underscore_case")).toBe("underscoreCase")
      expect(underscoreToCamel("get_user_data")).toBe("getUserData")
      expect(underscoreToCamel("test_value")).toBe("testValue")
    })

    it("handles strings without underscores", () => {
      expect(underscoreToCamel("lowercase")).toBe("lowercase")
      expect(underscoreToCamel("test")).toBe("test")
    })
  })

  describe("objectTransformator", () => {
    const mockFunc = jest.fn(data => data)
    const mockAction = jest.fn((target, key, value) => ({ ...target, [key]: value }))

    beforeEach(() => {
      mockFunc.mockClear()
      mockAction.mockClear()
    })

    it("transforms arrays", () => {
      const data = [1, 2, 3]
      const result = objectTransformator(data, {
        func: mockFunc,
        action: mockAction,
        omit: [],
      })

      expect(result).toEqual([1, 2, 3])
      expect(mockFunc).toHaveBeenCalledTimes(3)
    })

    it("transforms objects", () => {
      const data = { a: 1, b: 2 }
      const result = objectTransformator(data, {
        func: mockFunc,
        action: mockAction,
        omit: [],
      })

      expect(mockFunc).toHaveBeenCalledTimes(2)
      expect(mockAction).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ a: 1, b: 2 })
    })

    it("omits specified keys", () => {
      const data = { a: 1, b: 2, c: 3 }
      const result = objectTransformator(data, {
        func: mockFunc,
        action: mockAction,
        omit: ["b"],
      })

      expect(mockFunc).toHaveBeenCalledTimes(2) // a and c only
      expect(result.b).toBe(2) // b should be preserved as-is
    })

    it("returns primitive values unchanged", () => {
      expect(objectTransformator("string", { func: mockFunc, action: mockAction })).toBe("string")
      expect(objectTransformator(42, { func: mockFunc, action: mockAction })).toBe(42)
      expect(objectTransformator(null, { func: mockFunc, action: mockAction })).toBeNull()
    })
  })

  describe("underscoredKeys", () => {
    it("converts object keys to underscore case", () => {
      const data = { firstName: "John", lastName: "Doe" }
      const result = underscoredKeys(data)

      expect(result).toEqual({ first_name: "John", last_name: "Doe" })
    })

    it("handles nested objects", () => {
      const data = {
        firstName: "John",
        contactInfo: { phoneNumber: "123-456-7890" },
      }
      const result = underscoredKeys(data)

      expect(result).toEqual({
        first_name: "John",
        contact_info: { phone_number: "123-456-7890" },
      })
    })

    it("omits specified keys", () => {
      const data = { firstName: "John", lastName: "Doe", specialKey: "value" }
      const result = underscoredKeys(data, { omit: ["specialKey"] })

      expect(result).toEqual({
        first_name: "John",
        last_name: "Doe",
        specialKey: "value",
      })
    })
  })

  describe("camelizeKeys", () => {
    it("converts object keys to camelCase", () => {
      const data = { first_name: "John", last_name: "Doe" }
      const result = camelizeKeys(data)

      expect(result).toEqual({ firstName: "John", lastName: "Doe" })
    })

    it("handles nested objects", () => {
      const data = {
        first_name: "John",
        contact_info: { phone_number: "123-456-7890" },
      }
      const result = camelizeKeys(data)

      expect(result).toEqual({
        firstName: "John",
        contactInfo: { phoneNumber: "123-456-7890" },
      })
    })

    it("omits specified keys", () => {
      const data = { first_name: "John", last_name: "Doe", special_key: "value" }
      const result = camelizeKeys(data, { omit: ["special_key"] })

      expect(result).toEqual({
        firstName: "John",
        lastName: "Doe",
        special_key: "value",
      })
    })
  })
})
