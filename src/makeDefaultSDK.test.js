import makeDefaultSDK from "./makeDefaultSDK"
import makeSDK from "./sdk"

jest.mock("./sdk")

describe("makeDefaultSDK", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    makeSDK.mockReturnValue({
      makeChart: jest.fn(),
      getRoot: jest.fn(),
      appendChild: jest.fn(),
    })
  })

  it("creates SDK with all chart libraries", () => {
    makeDefaultSDK()

    expect(makeSDK).toHaveBeenCalledWith({
      ui: expect.objectContaining({
        dygraph: expect.any(Function),
        easypiechart: expect.any(Function),
        gauge: expect.any(Function),
        groupBoxes: expect.any(Function),
        number: expect.any(Function),
        d3pie: expect.any(Function),
        bars: expect.any(Function),
        table: expect.any(Function),
      }),
      plugins: expect.objectContaining({
        move: expect.any(Function),
        hover: expect.any(Function),
        pan: expect.any(Function),
        highlight: expect.any(Function),
        select: expect.any(Function),
        selectVertical: expect.any(Function),
        play: expect.any(Function),
        annotationSync: expect.any(Function),
      }),
      attributes: expect.objectContaining({
        _v: "v3",
        chartLibrary: "dygraph",
        navigation: "pan",
        after: -900,
        overlays: { proceeded: { type: "proceeded" } },
      }),
    })
  })

  it("merges custom attributes with defaults", () => {
    const customAttributes = {
      chartLibrary: "gauge",
      customAttribute: "test",
    }

    makeDefaultSDK({ attributes: customAttributes })

    expect(makeSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.objectContaining({
          _v: "v3",
          chartLibrary: "gauge",
          navigation: "pan",
          after: -900,
          customAttribute: "test",
          overlays: { proceeded: { type: "proceeded" } },
        }),
      })
    )
  })

  it("passes through additional options", () => {
    const customOptions = {
      customOption: "value",
      anotherOption: 123,
    }

    makeDefaultSDK(customOptions)

    expect(makeSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        customOption: "value",
        anotherOption: 123,
      })
    )
  })

  it("returns SDK instance", () => {
    const mockSDK = { test: "sdk" }
    makeSDK.mockReturnValue(mockSDK)

    const result = makeDefaultSDK()

    expect(result).toBe(mockSDK)
  })

  it("handles no options provided", () => {
    makeDefaultSDK()

    expect(makeSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: expect.objectContaining({
          _v: "v3",
          chartLibrary: "dygraph",
          navigation: "pan",
          after: -900,
        }),
      })
    )
  })
})
