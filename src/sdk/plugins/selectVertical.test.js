import { makeTestChart } from "@jest/testUtilities"
import selectVerticalPlugin from "./selectVertical"

describe("selectVertical plugin", () => {
  let sdk, chart, mockNode

  beforeEach(() => {
    const { sdk: testSdk, chart: testChart } = makeTestChart({
      attributes: { navigation: "selectVertical" },
    })

    chart = testChart
    sdk = testSdk

    mockNode = {
      updateAttributes: jest.fn(),
    }

    chart.getApplicableNodes = jest.fn(() => [mockNode])
    chart.moveY = jest.fn()
  })

  it("returns cleanup function", () => {
    const cleanup = selectVerticalPlugin(sdk)
    expect(typeof cleanup).toBe("function")
  })

  it("handles highlightVerticalStart for selectVertical navigation", () => {
    selectVerticalPlugin(sdk)

    sdk.trigger("highlightVerticalStart", chart)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: false,
      highlighting: true,
    })
  })

  it("ignores highlightVerticalStart for non-selectVertical navigation", () => {
    chart.getAttribute = jest.fn(() => "pan")
    selectVerticalPlugin(sdk)

    sdk.trigger("highlightVerticalStart", chart)

    expect(mockNode.updateAttributes).not.toHaveBeenCalled()
  })

  it("handles highlightVerticalEnd for selectVertical navigation", () => {
    selectVerticalPlugin(sdk)

    sdk.trigger("highlightVerticalEnd", chart, [10, 100])

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: true,
      highlighting: false,
    })
    expect(chart.moveY).toHaveBeenCalledWith(10, 100)
  })

  it("handles highlightVerticalEnd with null value range", () => {
    selectVerticalPlugin(sdk)

    sdk.trigger("highlightVerticalEnd", chart, null)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      enabledHover: true,
      highlighting: false,
    })
    expect(chart.moveY).not.toHaveBeenCalled()
  })

  it("ignores highlightVerticalEnd for non-selectVertical navigation", () => {
    chart.getAttribute = jest.fn(() => "pan")
    selectVerticalPlugin(sdk)

    sdk.trigger("highlightVerticalEnd", chart, [10, 100])

    expect(mockNode.updateAttributes).not.toHaveBeenCalled()
    expect(chart.moveY).not.toHaveBeenCalled()
  })

  it("cleanup function removes event listeners", () => {
    const cleanup = selectVerticalPlugin(sdk)

    expect(() => cleanup()).not.toThrow()
  })
})
