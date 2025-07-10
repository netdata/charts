import makeNode from "./makeNode"

describe("makeNode", () => {
  let mockSdk
  let mockParent
  let node

  beforeEach(() => {
    mockSdk = {
      trigger: jest.fn(),
    }
    mockParent = {
      getAttributes: jest.fn(() => ({ timezone: "UTC" })),
      removeChild: jest.fn(),
    }

    const initialAttributes = {
      id: "test-chart",
      chartLibrary: "dygraph",
      pristine: {},
      drawer: {
        action: "values",
        tab: "window",
        showAdvancedStats: false,
      },
    }

    node = makeNode({ sdk: mockSdk, parent: mockParent, attributes: initialAttributes })
  })

  describe("basic attribute operations", () => {
    it("gets simple attributes", () => {
      expect(node.getAttribute("id")).toBe("test-chart")
      expect(node.getAttribute("chartLibrary")).toBe("dygraph")
    })

    it("sets simple attributes", () => {
      node.setAttribute("newAttr", "newValue")
      expect(node.getAttribute("newAttr")).toBe("newValue")
    })

    it("returns default value for non-existent attributes", () => {
      expect(node.getAttribute("nonExistent", "default")).toBe("default")
    })
  })

  describe("nested attribute operations", () => {
    it("gets nested attributes with dot notation", () => {
      expect(node.getAttribute("drawer.action")).toBe("values")
      expect(node.getAttribute("drawer.tab")).toBe("window")
      expect(node.getAttribute("drawer.showAdvancedStats")).toBe(false)
    })

    it("sets nested attributes with dot notation", () => {
      node.setAttribute("drawer.newProp", "newValue")
      expect(node.getAttribute("drawer.newProp")).toBe("newValue")
      expect(node.getAttribute("drawer.action")).toBe("values")
    })

    it("returns default for non-existent nested attributes", () => {
      expect(node.getAttribute("drawer.nonExistent", "default")).toBe("default")
      expect(node.getAttribute("nonExistent.prop", "default")).toBe("default")
    })

    it("creates nested structure when setting deep paths", () => {
      node.setAttribute("deep.nested.path", "value")
      expect(node.getAttribute("deep.nested.path")).toBe("value")
    })
  })

  describe("updateAttribute", () => {
    it("updates simple attributes and triggers listeners", () => {
      const listener = jest.fn()
      node.onAttributeChange("testAttr", listener)

      node.updateAttribute("testAttr", "newValue")

      expect(node.getAttribute("testAttr")).toBe("newValue")
      expect(listener).toHaveBeenCalledWith("newValue", undefined, "testAttr")
    })

    it("updates nested attributes and triggers listeners", () => {
      const listener = jest.fn()
      node.onAttributeChange("drawer.showAdvancedStats", listener)

      node.updateAttribute("drawer.showAdvancedStats", true)

      expect(node.getAttribute("drawer.showAdvancedStats")).toBe(true)
      expect(listener).toHaveBeenCalledWith(true, false, "drawer.showAdvancedStats")
    })

    it("does not trigger listeners if value unchanged", () => {
      const listener = jest.fn()
      node.onAttributeChange("drawer.action", listener)

      node.updateAttribute("drawer.action", "values")

      expect(listener).not.toHaveBeenCalled()
    })

    it("handles undefined to defined transitions", () => {
      const listener = jest.fn()
      node.onAttributeChange("newAttr", listener)

      node.updateAttribute("newAttr", "value")

      expect(listener).toHaveBeenCalledWith("value", undefined, "newAttr")
    })
  })

  describe("updateAttributes", () => {
    it("updates multiple simple attributes", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()
      node.onAttributeChange("attr1", listener1)
      node.onAttributeChange("attr2", listener2)

      node.updateAttributes({
        attr1: "value1",
        attr2: "value2",
      })

      expect(node.getAttribute("attr1")).toBe("value1")
      expect(node.getAttribute("attr2")).toBe("value2")
      expect(listener1).toHaveBeenCalledWith("value1", undefined, "attr1")
      expect(listener2).toHaveBeenCalledWith("value2", undefined, "attr2")
    })

    it("handles nested objects in updateAttributes", () => {
      const listener = jest.fn()
      node.onAttributeChange("drawer", listener)

      node.updateAttributes({
        drawer: {
          showAdvancedStats: true,
          action: "compare",
        },
      })

      expect(node.getAttribute("drawer.showAdvancedStats")).toBe(true)
      expect(node.getAttribute("drawer.action")).toBe("compare")
      expect(listener).toHaveBeenCalledWith(
        { action: "compare", showAdvancedStats: true },
        { action: "values", showAdvancedStats: false, tab: "window" },
        "drawer"
      )
    })

    it("handles mixed flat and nested updates", () => {
      node.updateAttributes({
        simpleAttr: "value",
        nested: {
          prop: "nested value",
        },
        dot: { notation: "dot value" },
      })

      expect(node.getAttribute("simpleAttr")).toBe("value")
      expect(node.getAttribute("nested.prop")).toBe("nested value")
      expect(node.getAttribute("dot.notation")).toBe("dot value")
    })
  })

  describe("attribute listeners", () => {
    it("supports multiple listeners on same attribute", () => {
      const listener1 = jest.fn()
      const listener2 = jest.fn()

      node.onAttributeChange("testAttr", listener1)
      node.onAttributeChange("testAttr", listener2)

      node.updateAttribute("testAttr", "value")

      expect(listener1).toHaveBeenCalledWith("value", undefined, "testAttr")
      expect(listener2).toHaveBeenCalledWith("value", undefined, "testAttr")
    })

    it("supports listening to multiple attributes", () => {
      const listener = jest.fn()

      node.onAttributesChange(["attr1", "attr2"], listener)

      node.updateAttribute("attr1", "value1")
      node.updateAttribute("attr2", "value2")

      expect(listener).toHaveBeenCalledTimes(2)
    })

    it("supports once listeners", () => {
      const listener = jest.fn()

      node.onceAttributeChange("testAttr", listener)

      node.updateAttribute("testAttr", "value1")
      node.updateAttribute("testAttr", "value2")

      expect(listener).toHaveBeenCalledTimes(1)
      expect(listener).toHaveBeenCalledWith("value1", undefined, "testAttr")
    })
  })

  describe("pristine functionality", () => {
    it("tracks pristine state changes", () => {
      node.updateAttribute("chartType", "table")

      expect(mockSdk.trigger).toHaveBeenCalledWith(
        "pristineChanged",
        "pristine",
        node,
        "table",
        undefined
      )
    })
  })

  describe("edge cases", () => {
    it("handles null/undefined values in nested attributes", () => {
      node.setAttribute("test.null", null)
      node.setAttribute("test.undefined", undefined)

      expect(node.getAttribute("test.null")).toBe(null)
      expect(node.getAttribute("test.undefined", "default")).toBe("default")
    })

    it("handles empty string paths", () => {
      node.setAttribute("", "value")
      expect(node.getAttribute("", "default")).toBe("default")
    })

    it("handles null parent gracefully", () => {
      const nodeWithoutParent = makeNode({
        sdk: mockSdk,
        parent: null,
        attributes: { id: "test" },
      })

      expect(nodeWithoutParent.getAttribute("id")).toBe("test")
    })
  })

  describe("inheritance", () => {
    it("inherits parent attributes", () => {
      mockParent.getAttributes.mockReturnValue({
        timezone: "America/New_York",
        inherited: "value",
      })

      const childNode = makeNode({
        sdk: mockSdk,
        parent: mockParent,
        attributes: { id: "child" },
      })

      expect(childNode.getAttribute("timezone")).toBe("America/New_York")
      expect(childNode.getAttribute("inherited")).toBe("value")
      expect(childNode.getAttribute("id")).toBe("child")
    })
  })
})
