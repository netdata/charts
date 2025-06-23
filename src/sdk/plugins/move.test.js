import { makeTestChart } from "@jest/testUtilities"
import movePlugin from "./move"

describe("move plugin", () => {
  let sdk, chart, mockNode

  beforeEach(() => {
    const { sdk: testSdk, chart: testChart } = makeTestChart({
      attributes: { autoPlay: false },
    })

    chart = testChart
    sdk = testSdk

    mockNode = {
      updateAttributes: jest.fn(),
      updateAttribute: jest.fn(),
      getAttribute: jest.fn(() => true),
      setAttributes: jest.fn(),
      getAttributes: jest.fn(() => ({
        after: 0,
        hovering: false,
        active: true,
        loaded: true,
        fetchStartedAt: null,
      })),
      getRoot: jest.fn(() => ({
        getAttribute: jest.fn(() => false),
      })),
      lastFetch: [0, 0],
      getDateWindow: jest.fn(() => [0, 0]),
      updateAttribute: jest.fn(),
    }

    chart.getApplicableNodes = jest.fn(() => [mockNode])
    chart.updateStaticValueRange = jest.fn()
    chart.resetStaticValueRange = jest.fn()
    chart.moveX = jest.fn()
    chart.onAttributeChange = jest.fn(() => jest.fn())

    jest.spyOn(Date, "now").mockReturnValue(2000000)
  })

  afterEach(() => {
    Date.now.mockRestore()
  })

  it("handles moveX events", () => {
    movePlugin(sdk)

    sdk.trigger("moveX", chart, 1000, 2000)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      after: 1000,
      before: 2000,
    })
  })

  it("handles negative after values in moveX", () => {
    movePlugin(sdk)

    sdk.trigger("moveX", chart, -300, 0)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      after: -300,
      before: 0,
    })
  })

  it("adjusts for autoPlay when before is in future", () => {
    chart.getAttribute = jest.fn(() => true)
    movePlugin(sdk)

    sdk.trigger("moveX", chart, 1000, 3000)

    expect(mockNode.updateAttributes).toHaveBeenCalledWith({
      after: -1999,
      before: 0,
    })
  })

  it("handles moveY events", () => {
    movePlugin(sdk)

    sdk.trigger("moveY", chart, 10, 100)

    expect(chart.updateStaticValueRange).toHaveBeenCalledWith([10, 100])
  })

  it("handles moveY with negative after value", () => {
    chart.getAttribute = jest.fn(() => -300)
    movePlugin(sdk)

    sdk.trigger("moveY", chart, 10, 100)

    expect(chart.moveX).toHaveBeenCalled()
  })

  it("sets up after attribute listener on moveY", () => {
    movePlugin(sdk)

    sdk.trigger("moveY", chart, 10, 100)

    expect(chart.onAttributeChange).toHaveBeenCalledWith("after", expect.any(Function))
  })

  it("updates inactive nodes as not loaded", () => {
    mockNode.getAttribute = jest.fn(() => false)
    movePlugin(sdk)

    sdk.trigger("moveX", chart, 1000, 2000)

    expect(mockNode.updateAttribute).toHaveBeenCalledWith("loaded", false)
  })
})
