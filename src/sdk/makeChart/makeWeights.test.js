import makeWeights from "./makeWeights"
import { makeTestChart } from "@jest/testUtilities"

describe("makeWeights", () => {
  let chart
  let sdk
  let weightsModule

  beforeEach(() => {
    const testChart = makeTestChart()
    chart = testChart.chart
    sdk = testChart.sdk

    global.AbortController = jest.fn(() => ({
      abort: jest.fn(),
      signal: {},
    }))

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ weights: {} }),
      })
    )

    weightsModule = makeWeights(chart, sdk)
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
    const spy = jest.spyOn(chart, "updateAttributes")
    const triggerSpy = jest.spyOn(chart, "trigger")

    weightsModule.fetchWeights("test-tab")

    expect(spy).toHaveBeenCalledWith({
      weightsLoading: true,
    })
    expect(triggerSpy).toHaveBeenCalledWith("weights:startFetch")
  })

  it("creates abort controller when fetching", () => {
    weightsModule.fetchWeights("test-tab")

    expect(global.AbortController).toHaveBeenCalled()
  })
})
