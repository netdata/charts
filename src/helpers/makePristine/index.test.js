import makePristine from "."

describe("makePristine", () => {
  let pristine
  let resource
  let mockDispatch

  beforeEach(() => {
    mockDispatch = jest.fn()
    pristine = makePristine("pristine", ["name", "age"], mockDispatch)
    resource = {
      name: "John",
      age: 30,
      pristine: {},
    }
  })

  describe("updatePristine", () => {
    it("stores original value when property changes", () => {
      pristine.updatePristine(resource, "name", "Jane")

      expect(mockDispatch).toHaveBeenCalledWith({ pristine: { name: "John" } }, resource)
    })

    it("ignores properties not in keys set", () => {
      pristine.updatePristine(resource, "email", "john@example.com")

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it("ignores when resource has no pristine property", () => {
      delete resource.pristine
      pristine.updatePristine(resource, "name", "Jane")

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it("ignores when value hasn't changed", () => {
      pristine.updatePristine(resource, "name", "John")

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it("removes pristine entry when value reverts to original", () => {
      resource.pristine = { name: "John" }

      pristine.updatePristine(resource, "name", "John")

      expect(mockDispatch).toHaveBeenCalledWith({ pristine: {} }, resource)
    })

    it("preserves other pristine values when removing one", () => {
      resource.pristine = { name: "John", age: 30 }

      pristine.updatePristine(resource, "name", "John")

      expect(mockDispatch).toHaveBeenCalledWith({ pristine: { age: 30 } }, resource)
    })

    it("doesn't store pristine if property already in pristine and value different", () => {
      resource.pristine = { name: "Original" }

      pristine.updatePristine(resource, "name", "Jane")

      expect(mockDispatch).not.toHaveBeenCalled()
    })

    it("returns previous pristine value when updating", () => {
      const prevPristine = { existing: "value" }
      resource.pristine = prevPristine

      const result = pristine.updatePristine(resource, "name", "Jane")

      expect(result).toBe(prevPristine)
    })
  })

  describe("keys that start undefined", () => {
    it("keeps the first original across repeated changes", () => {
      const target = makePristine("pristine", ["staticZones"])
      const resource = { pristine: {} }

      target.updatePristine(resource, "staticZones", ["a"])
      resource.staticZones = ["a"]
      target.updatePristine(resource, "staticZones", ["b"])
      resource.staticZones = ["b"]

      expect(resource.pristine).toHaveProperty("staticZones", undefined)

      target.resetPristine(resource)

      expect(resource.staticZones).toBeUndefined()
      expect(resource.pristine).toEqual({})
    })

    it("clears the entry when the value changes back to undefined", () => {
      const target = makePristine("pristine", ["staticZones"])
      const resource = { pristine: {} }

      target.updatePristine(resource, "staticZones", ["a"])
      resource.staticZones = ["a"]
      target.updatePristine(resource, "staticZones", undefined)

      expect(resource.pristine).toEqual({})
    })
  })

  describe("resetPristine", () => {
    it("resets resource to pristine state and clears pristine", () => {
      resource.pristine = { name: "Original", age: 25 }

      pristine.resetPristine(resource)

      expect(mockDispatch).toHaveBeenCalledWith({ name: "Original", age: 25, pristine: {} }, resource)
    })
  })

  describe("with custom dispatch", () => {
    it("uses default dispatch when none provided", () => {
      const defaultPristine = makePristine("pristine", ["name"])
      const testResource = { name: "John", pristine: {} }

      defaultPristine.updatePristine(testResource, "name", "Jane")

      expect(testResource.pristine).toEqual({ name: "John" })
    })
  })
})
