import makeWeights from "./makeWeights"

jest.mock("./api", () => ({
  fetchChartWeights: jest.fn(() => Promise.resolve())
}))

describe("makeWeights", () => {
  let mockChart
  let mockSdk
  let weightsModule

  beforeEach(() => {
    mockChart = {
      getAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      updateAttributes: jest.fn(),
      trigger: jest.fn()
    }

    mockSdk = {}

    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {}
    }))

    weightsModule = makeWeights(mockChart, mockSdk)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("returns weights object and fetchWeights function", () => {
    expect(weightsModule).toHaveProperty("weights")
    expect(weightsModule).toHaveProperty("fetchWeights")
    expect(typeof weightsModule.fetchWeights).toBe("function")
  })

  it("initializes with empty weights object", () => {
    expect(weightsModule.weights).toEqual({})
  })

  it("fetchWeights updates loading state", () => {
    weightsModule.fetchWeights("test-tab")
    
    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      weightsLoading: true
    })
    expect(mockChart.trigger).toHaveBeenCalledWith("weights:startFetch")
  })

  it("creates abort controller when fetching", () => {
    weightsModule.fetchWeights("test-tab")
    
    expect(global.AbortController).toHaveBeenCalled()
  })

  it("handles fetch without authentication", () => {
    mockChart.getAttribute.mockReturnValue(null)
    
    expect(() => weightsModule.fetchWeights()).not.toThrow()
  })

  it("handles bearer token authentication", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "bearer") return "test-token"
      return null
    })
    
    expect(() => weightsModule.fetchWeights()).not.toThrow()
  })

  it("handles xNetdataBearer authentication", () => {
    mockChart.getAttribute.mockImplementation(key => {
      if (key === "xNetdataBearer") return "test-token"
      return null
    })
    
    expect(() => weightsModule.fetchWeights()).not.toThrow()
  })
})