import makeContainer from "./makeContainer"

describe("makeContainer", () => {
  let container
  let mockSDK
  let mockParent

  beforeEach(() => {
    mockSDK = {
      trigger: jest.fn(),
      getRoot: jest.fn(() => ({})),
    }
    mockParent = {
      getId: () => "parent-id",
      getAttributes: () => ({ timezone: "UTC" }),
      removeChild: jest.fn(),
    }
    container = makeContainer({
      sdk: mockSDK,
      parent: mockParent,
      attributes: { id: "test-container" },
    })
  })

  it("creates a container with correct type", () => {
    expect(container.type).toBe("container")
  })

  it("inherits node properties", () => {
    expect(container.getId()).toBe("test-container")
    expect(container.sdk).toBe(mockSDK)
  })

  describe("appendChild", () => {
    it("adds child and triggers events", () => {
      const mockChild = {
        setParent: jest.fn(),
        type: "chart",
      }

      container.appendChild(mockChild)

      expect(mockChild.setParent).toBeCalledWith(container, { inherit: true })
      expect(mockSDK.trigger).toBeCalledWith("nodeAdded", container, mockChild)
      expect(mockSDK.trigger).toBeCalledWith("chartAdded", container, mockChild)
    })

    it("respects inherit option", () => {
      const mockChild = {
        setParent: jest.fn(),
        type: "chart",
      }

      container.appendChild(mockChild, { inherit: false })

      expect(mockChild.setParent).toBeCalledWith(container, { inherit: false })
    })
  })

  describe("removeChild", () => {
    it("removes child by id and triggers events", () => {
      const mockChild = {
        setParent: jest.fn(),
        getId: () => "child-id",
        type: "chart",
      }

      container.appendChild(mockChild)
      container.removeChild("child-id")

      expect(container.getChildren()).toHaveLength(0)
    })
  })

  describe("getChildren", () => {
    it("returns empty array initially", () => {
      expect(container.getChildren()).toEqual([])
    })

    it("returns added children", () => {
      const mockChild = {
        setParent: jest.fn(),
        getId: () => "child-id",
        type: "chart",
      }

      container.appendChild(mockChild)
      expect(container.getChildren()).toEqual([mockChild])
    })
  })

  describe("getNode", () => {
    it("finds matching child", () => {
      const mockChild = {
        setParent: jest.fn(),
        match: jest.fn(() => true),
        type: "chart",
      }

      container.appendChild(mockChild)
      const result = container.getNode({ type: "chart" })

      expect(result).toBe(mockChild)
    })

    it("returns undefined when no match", () => {
      const mockChild = {
        setParent: jest.fn(),
        match: jest.fn(() => false),
        type: "chart",
      }

      container.appendChild(mockChild)
      const result = container.getNode({ type: "other" })

      expect(result).toBeUndefined()
    })

    it("searches nested containers", () => {
      const nestedChild = {
        setParent: jest.fn(),
        match: jest.fn(() => true),
        type: "chart",
      }

      const nestedContainer = {
        setParent: jest.fn(),
        match: jest.fn(() => false),
        type: "container",
        getNode: jest.fn(() => nestedChild),
      }

      container.appendChild(nestedContainer)
      const result = container.getNode({ type: "chart" })

      expect(result).toBe(nestedChild)
    })
  })

  describe("getNextColor", () => {
    it("returns consistent color for same id", () => {
      const mockGetNext = jest.fn(() => "#ff0000")

      const color1 = container.getNextColor(mockGetNext, "group1", "id1")
      const color2 = container.getNextColor(mockGetNext, "group1", "id1")

      expect(color1).toBe("#ff0000")
      expect(color2).toBe("#ff0000")
      expect(mockGetNext).toBeCalledTimes(1)
    })

    it("returns different colors for different ids", () => {
      const mockGetNext = jest.fn().mockReturnValueOnce("#ff0000").mockReturnValueOnce("#00ff00")

      const color1 = container.getNextColor(mockGetNext, "group1", "id1")
      const color2 = container.getNextColor(mockGetNext, "group1", "id2")

      expect(color1).toBe("#ff0000")
      expect(color2).toBe("#00ff00")
      expect(mockGetNext).toBeCalledTimes(2)
    })
  })

  describe("destroy", () => {
    it("destroys node and children", () => {
      const mockChild = {
        setParent: jest.fn(),
        destroy: jest.fn(),
        type: "chart",
      }

      container.appendChild(mockChild)
      container.destroy()

      expect(mockChild.destroy).toBeCalled()
      expect(container.getChildren()).toEqual([])
    })

    it("handles being called multiple times", () => {
      container.destroy()
      container.destroy()
    })
  })
})
