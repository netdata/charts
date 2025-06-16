import parseDOM from "./parseDOM"

describe("parseDOM", () => {
  let mockSDK
  let mockDocument

  beforeEach(() => {
    mockSDK = {
      getRoot: jest.fn(() => ({ id: "root" })),
      makeContainer: jest.fn(() => ({ id: "container" })),
      makeChart: jest.fn(() => ({ id: "chart" }))
    }

    // Mock DOM
    global.document = {
      querySelectorAll: jest.fn(() => [])
    }
  })

  it("creates parseDOM result object", () => {
    const result = parseDOM(mockSDK)
    expect(typeof result).toBe("object")
    expect(result).toHaveProperty("elements")
    expect(result).toHaveProperty("nodeByElement")
  })

  it("handles empty DOM", () => {
    expect(() => parseDOM(mockSDK)).not.toThrow()
  })

  it("initializes with SDK when elements present", () => {
    mockSDK.getRoot.mockReturnValue({
      appendChild: jest.fn()
    })
    
    global.document.querySelectorAll = jest.fn(() => [{
      hasAttribute: jest.fn(() => true),
      getAttributeNames: jest.fn(() => ["data-id"]),
      getAttribute: jest.fn(() => "test"),
      parentElement: null
    }])
    
    parseDOM(mockSDK)
    expect(mockSDK.getRoot).toBeCalled()
  })
})