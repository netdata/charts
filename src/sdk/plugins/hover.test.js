import makeSDK from "@/sdk"
import hover from "./hover"

const makeHoverSDK = () => {
  const sdk = makeSDK({
    ui: {},
    plugins: { hover },
  })
  const first = sdk.makeChartCore()
  const second = sdk.makeChartCore()

  sdk.appendChild(first)
  sdk.appendChild(second)

  return { first, second, sdk }
}

describe("hover plugin", () => {
  beforeEach(() => jest.useFakeTimers())

  afterEach(() => jest.useRealTimers())

  it("publishes only the latest synchronized hover within an animation frame", () => {
    const { first, second, sdk } = makeHoverSDK()
    const firstValues = []
    const secondValues = []

    first.onAttributeChange("hoverX", value => firstValues.push(value))
    second.onAttributeChange("hoverX", value => secondValues.push(value))

    sdk.trigger("highlightHover", first, 1000, "first")
    sdk.trigger("highlightHover", first, 2000, "second")
    sdk.trigger("highlightHover", first, 3000, "third")

    expect(first.getAttribute("hoverX")).toBeNull()
    expect(second.getAttribute("hoverX")).toBeNull()

    jest.advanceTimersByTime(16)

    expect(firstValues).toEqual([[3000, "third"]])
    expect(secondValues).toEqual([[3000, "third"]])
  })

  it("does not republish an unchanged synchronized hover", () => {
    const { first, second, sdk } = makeHoverSDK()
    const values = []

    second.onAttributeChange("hoverX", value => values.push(value))

    sdk.trigger("highlightHover", first, 3000, "third")
    jest.advanceTimersByTime(16)
    sdk.trigger("highlightHover", first, 3000, "third")
    jest.advanceTimersByTime(16)

    expect(values).toEqual([[3000, "third"]])
  })

  it("cancels pending hover work when the pointer leaves", () => {
    const { first, second, sdk } = makeHoverSDK()
    const values = []

    second.onAttributeChange("hoverX", value => values.push(value))

    sdk.trigger("highlightHover", first, 3000, "third")
    sdk.trigger("highlightBlur", first)
    jest.advanceTimersByTime(16)

    expect(second.getAttribute("hoverX")).toBeNull()
    expect(values).toEqual([])
  })

  it("cancels pending hover work when the plugin is unregistered", () => {
    const { first, second, sdk } = makeHoverSDK()

    sdk.trigger("highlightHover", first, 3000, "third")
    sdk.unregister("hover")
    jest.advanceTimersByTime(16)

    expect(second.getAttribute("hoverX")).toBeNull()
  })
})
