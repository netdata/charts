import { makeTestChart } from "@jest/testUtilities"
import selectPlugin from "./select"

describe("select plugin", () => {
  let sdk, chart, mockNode

  beforeEach(() => {
    const { sdk: testSdk, chart: testChart } = makeTestChart({
      attributes: { navigation: "select" },
    })

    chart = testChart
    sdk = testSdk

    mockNode = {
      updateAttributes: jest.fn(),
    }

    chart.getApplicableNodes = jest.fn(() => [mockNode])
    chart.moveX = jest.fn()
  })

  it("returns cleanup function", () => {
    const cleanup = selectPlugin(sdk)
    expect(typeof cleanup).toBe("function")
  })

  it("handles highlightStart for select navigation", () => {
    selectPlugin(sdk)

    sdk.trigger("highlightStart", chart)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: false,
      highlighting: true,
    })
  })

  it("ignores highlightStart for non-select navigation", () => {
    chart.getAttribute = jest.fn(() => "pan")
    selectPlugin(sdk)

    sdk.trigger("highlightStart", chart)

    expect(mockNode.updateAttributes).not.toHaveBeenCalled()
  })

  it("handles highlightEnd for select navigation", () => {
    selectPlugin(sdk)

    sdk.trigger("highlightEnd", chart, [1000, 2000])

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: true,
      highlighting: false,
    })
    expect(chart.moveX).toHaveBeenCalledWith(1000, 2000)
  })

  it("handles highlightEnd with null highlight", () => {
    selectPlugin(sdk)

    sdk.trigger("highlightEnd", chart, null)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: true,
      highlighting: false,
    })
    expect(chart.moveX).not.toHaveBeenCalled()
  })

  it("ignores highlightEnd for non-select navigation", () => {
    chart.getAttribute = jest.fn(() => "pan")
    selectPlugin(sdk)

    sdk.trigger("highlightEnd", chart, [1000, 2000])

    expect(mockNode.updateAttributes).not.toHaveBeenCalled()
    expect(chart.moveX).not.toHaveBeenCalled()
  })

  it("cleanup function removes event listeners", () => {
    const cleanup = selectPlugin(sdk)

    expect(() => cleanup()).not.toThrow()
  })
})
