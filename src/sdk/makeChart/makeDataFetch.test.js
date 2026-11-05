import makeDataFetch from "./makeDataFetch"
import { makeTestChart } from "@jest/testUtilities"
import makeDefaultSDK from "@/makeDefaultSDK"

const rawPayload = {
  result: {
    data: [
      [1000, [10]],
      [2000, [20]],
    ],
    labels: ["time", "value"],
    point: {
      value: 0,
    },
  },
}

describe("makeDataFetch", () => {
  let mockChart
  let mockRoot

  beforeEach(() => {
    const attributes = {
      after: -300,
      before: 0,
      firstEntry: 1000000,
      chartType: "line",
      title: null,
      loaded: false,
      initializedFilters: true,
    }
    const rootAttributes = {
      paused: false,
    }
    mockRoot = {
      getAttribute: jest.fn((name, fallback) => rootAttributes[name] ?? fallback),
      updateAttribute: jest.fn((name, value) => {
        rootAttributes[name] = value
      }),
      trigger: jest.fn(),
    }

    mockChart = {
      getAttribute: jest.fn((name, fallback) => attributes[name] ?? fallback),
      getAttributes: jest.fn(() => attributes),
      updateAttribute: jest.fn((name, value) => {
        attributes[name] = value
      }),
      updateAttributes: jest.fn(nextAttributes => {
        Object.assign(attributes, nextAttributes)
      }),
      setAttributes: jest.fn(nextAttributes => {
        Object.assign(attributes, nextAttributes)
      }),
      trigger: jest.fn(),
      on: jest.fn(),
      getParent: jest.fn(() => ({
        updateAttribute: jest.fn(),
      })),
      getRoot: jest.fn(() => mockRoot),
      getDateWindow: jest.fn(() => {
        const anchor = attributes.renderedAt ?? attributes.liveAnchor ?? Date.now()
        return [anchor + attributes.after * 1000, anchor]
      }),
      getChart: jest.fn(() => Promise.resolve(rawPayload)),
      updateDimensions: jest.fn(),
      startAutofetch: jest.fn(),
      backoff: jest.fn(),
      invalidateRender: jest.fn(),
      invalidateClosestRowCache: jest.fn(),
      getFilteredNodeIds: jest.fn(() => []),
      getUnits: jest.fn(() => "value"),
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

  it("baseFetch forwards request attributes", async () => {
    await mockChart.baseFetch({ attrs: { liveRequestBefore: 1000 } })

    expect(mockChart.getChart).toHaveBeenCalledWith(mockChart, {
      attrs: { liveRequestBefore: 1000 },
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

  it("stores the live request anchor after a successful fetch", async () => {
    global.Date.now.mockReturnValue(1000500)
    const { chart } = makeTestChart({
      attributes: {
        after: -300,
        before: 0,
        renderedAt: null,
        hovering: false,
        viewUpdateEvery: 0,
      },
    })

    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(chart.getAttribute("liveAnchor")).toBe(1001000)
    expect(chart.getDateWindow()).toEqual([701000, 1001000])
  })

  it("keeps the live request anchor bound to its own fetch response", async () => {
    const resolves = []
    const getChart = jest.fn(
      () =>
        new Promise(resolve => {
          resolves.push(resolve)
        })
    )
    const sdk = makeDefaultSDK({
      attributes: {
        after: -300,
        before: 0,
        renderedAt: null,
        hovering: false,
        viewUpdateEvery: 0,
      },
    })
    const chart = sdk.makeChart({ getChart })
    sdk.appendChild(chart)

    global.Date.now.mockReturnValue(1000500)
    const firstFetch = chart.fetch()
    resolves[0](rawPayload)
    await firstFetch

    chart.updateAttribute("selectedDimensions", ["value"])
    global.Date.now.mockReturnValue(1001500)
    const secondFetch = chart.fetch()

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(chart.getAttribute("liveAnchor")).toBe(1001000)

    resolves[1](rawPayload)
    await secondFetch
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(chart.getAttribute("liveAnchor")).toBe(1002000)
  })

  it("queries the visible window when fetching while paused", async () => {
    mockChart.updateAttributes({
      firstEntry: 1,
      loaded: true,
      liveAnchor: 1000000,
      viewUpdateEvery: 600,
    })
    mockRoot.updateAttribute("paused", true)
    global.Date.now.mockReturnValue(1200500)

    await mockChart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockChart.getChart).toHaveBeenCalledWith(
      mockChart,
      expect.objectContaining({
        attrs: { liveRequestBefore: 1000 },
      })
    )
    expect(mockChart.getAttribute("liveAnchor")).toBe(1000000)
  })

  it("discards a current-time response after the chart freezes on an older window", async () => {
    mockChart.updateAttributes({
      loaded: true,
      liveAnchor: 1000000,
      viewUpdateEvery: 600,
    })
    mockChart.doneFetch(rawPayload, {
      liveAnchor: 1000000,
      requestAnchor: 1000000,
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    const previousPayload = mockChart.getPayload()
    mockChart.trigger.mockClear()

    let resolveFetch
    mockChart.getChart.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve
        })
    )
    global.Date.now.mockReturnValue(1200500)

    const fetch = mockChart.fetch()
    mockChart.updateAttributes({
      hovering: true,
      renderedAt: 1000000,
    })
    resolveFetch({
      result: {
        ...rawPayload.result,
        data: [[1200000, [30]]],
      },
    })
    await fetch
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockChart.getPayload()).toBe(previousPayload)
    expect(mockChart.getAttribute("liveAnchor")).toBe(1000000)
    expect(mockChart.getAttribute("loading")).toBe(false)
    expect(mockChart.trigger).not.toHaveBeenCalledWith(
      "successFetch",
      expect.anything(),
      expect.anything()
    )
  })

  it("accepts an in-flight response when the frozen window matches its request", async () => {
    mockChart.updateAttributes({
      firstEntry: 1,
      loaded: true,
      liveAnchor: 1000000,
    })
    let resolveFetch
    mockChart.getChart.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve
        })
    )
    global.Date.now.mockReturnValue(1000500)

    const fetch = mockChart.fetch()
    mockChart.updateAttributes({
      hovering: true,
      renderedAt: 1001000,
    })
    resolveFetch(rawPayload)
    await fetch
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockChart.getAttribute("liveAnchor")).toBe(1001000)
    expect(mockChart.trigger).toHaveBeenCalledWith("successFetch", expect.anything(), null)
  })

  it("invalidates rendering only when a successful payload becomes current", async () => {
    const { chart } = makeTestChart()
    const initialRevision = chart.getRenderRevision()

    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(chart.getRenderRevision()).toBe(initialRevision + 1)

    chart.consumePayload()

    expect(chart.getRenderRevision()).toBe(initialRevision + 1)
  })
})
