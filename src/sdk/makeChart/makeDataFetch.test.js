import makeDataFetch from "./makeDataFetch"

describe("makeDataFetch", () => {
  let mockChart

  beforeEach(() => {
    mockChart = {
      getAttribute: jest.fn(),
      getAttributes: jest.fn(() => ({
        after: -300,
        before: 0,
        firstEntry: 1000000,
        selectedChartType: null,
        chartType: "line",
        title: null,
        loaded: false,
        initializedFilters: false,
      })),
      updateAttribute: jest.fn(),
      updateAttributes: jest.fn(),
      setAttributes: jest.fn(),
      trigger: jest.fn(),
      on: jest.fn(),
      getParent: jest.fn(() => ({
        updateAttribute: jest.fn(),
      })),
      getRoot: jest.fn(() => ({
        trigger: jest.fn(),
      })),
      getChart: jest.fn(() =>
        Promise.resolve({
          result: {
            data: [
              [1000, 10],
              [2000, 20],
            ],
          },
        })
      ),
      updateDimensions: jest.fn(),
      startAutofetch: jest.fn(),
      backoff: jest.fn(),
      invalidateClosestRowCache: jest.fn(),
    }

    global.Date.now = jest.fn(() => 1000000000)
    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {},
    }))

    makeDataFetch(mockChart)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("adds getPayload method to chart", () => {
    expect(typeof mockChart.getPayload).toBe("function")
  })

  it("returns initial payload from getPayload", () => {
    const result = mockChart.getPayload()
    expect(result).toEqual({
      labels: [],
      data: [],
      all: [],
      tree: {},
    })
  })

  it("adds cancelFetch method to chart", () => {
    expect(typeof mockChart.cancelFetch).toBe("function")
  })

  it("adds doneFetch method to chart", () => {
    expect(typeof mockChart.doneFetch).toBe("function")
  })

  it("adds failFetch method to chart", () => {
    expect(typeof mockChart.failFetch).toBe("function")
  })

  it("adds baseFetch method to chart", () => {
    expect(typeof mockChart.baseFetch).toBe("function")
  })

  it("adds fetch method to chart", () => {
    expect(typeof mockChart.fetch).toBe("function")
  })

  it("adds consumePayload method to chart", () => {
    expect(typeof mockChart.consumePayload).toBe("function")
  })

  it("sets lastFetch property on chart", () => {
    expect(mockChart.lastFetch).toEqual([null, null])
  })

  it("registers fetch event listener", () => {
    expect(mockChart.on).toHaveBeenCalledWith("fetch", mockChart.fetch)
  })

  it("handles cancelFetch when no abort controller", () => {
    expect(() => mockChart.cancelFetch()).not.toThrow()
  })

  it("handles failFetch with abort error", () => {
    const abortError = { name: "AbortError" }

    mockChart.failFetch(abortError)

    expect(mockChart.updateAttribute).toHaveBeenCalledWith("loading", false)
  })

  it("handles failFetch with general error", () => {
    const error = { message: "Network error" }

    mockChart.failFetch(error)

    expect(mockChart.backoff).toHaveBeenCalled()
    expect(mockChart.trigger).toHaveBeenCalledWith("failFetch", error)
  })

  it("consumePayload returns false when no new payload", () => {
    const result = mockChart.consumePayload()
    expect(result).toBe(false)
  })

  it("baseFetch calls getChart with correct options", async () => {
    await mockChart.baseFetch()

    expect(mockChart.getChart).toHaveBeenCalledWith(mockChart, {
      params: {},
      signal: undefined,
    })
  })

  it("fetch updates loading state", () => {
    mockChart.fetch()

    expect(mockChart.updateAttributes).toHaveBeenCalledWith({
      processing: false,
      loading: true,
      fetchStartedAt: 1000000000,
    })
  })

  it("fetch triggers startFetch event", () => {
    mockChart.fetch()

    expect(mockChart.trigger).toHaveBeenCalledWith("startFetch")
  })
})
