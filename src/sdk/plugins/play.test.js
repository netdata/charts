import makeSDK from "@/sdk"
import hover from "./hover"
import play from "./play"

const setVisibility = visibilityState => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  })
}

const makePlaybackSDK = () => {
  const sdk = makeSDK({
    ui: {},
    plugins: { hover, play },
    attributes: {
      after: -900,
      autofetchOnWindowBlur: false,
    },
  })
  const chart = sdk.makeChartCore()
  chart.setUI({
    getRenderedAt: () => Date.now(),
    unmount: () => {},
  })
  sdk.appendChild(chart)

  return { chart, sdk }
}

describe("play plugin", () => {
  let chart
  let sdk
  let visibilityDescriptor

  beforeEach(() => {
    jest.useFakeTimers()
    visibilityDescriptor = Object.getOwnPropertyDescriptor(document, "visibilityState")
    setVisibility("visible")

    const focusTarget = document.createElement("button")
    document.body.appendChild(focusTarget)
    focusTarget.focus()
  })

  afterEach(() => {
    if (sdk) {
      sdk.unregister("play")
      sdk.unregister("hover")
    }

    jest.clearAllTimers()
    jest.useRealTimers()
    document.body.innerHTML = ""

    if (visibilityDescriptor)
      Object.defineProperty(document, "visibilityState", visibilityDescriptor)
    else delete document.visibilityState
  })

  it("recovers after chart hover ends while the window is blurred", () => {
    const playback = makePlaybackSDK()
    chart = playback.chart
    sdk = playback.sdk
    const root = sdk.getRoot()

    chart.focus()
    expect(root.getAttribute("hovering")).toBe(true)

    window.dispatchEvent(new Event("blur"))
    expect(root.getAttribute("paused")).toBe(true)

    chart.blur()
    expect(root.getAttribute("hovering")).toBe(false)

    window.dispatchEvent(new Event("focus"))
    expect(root.getAttribute("paused")).toBe(false)
    expect(root.getAttribute("autofetch")).toBe(true)
  })

  it("manual reconciliation clears hover blockers but preserves other reasons", () => {
    const playback = makePlaybackSDK()
    chart = playback.chart
    sdk = playback.sdk
    const root = sdk.getRoot()

    chart.focus()
    root.addPauseReason("hover-1", "hover")
    root.addPauseReason("modal-1")

    root.reconcilePlaybackState({ clearHover: true, blurred: false })

    expect(chart.getAttribute("focused")).toBe(false)
    expect(root.getAttribute("hovering")).toBe(false)
    expect(root.getPauseReasons()).toEqual([{ reasonId: "modal-1", reasonType: "interaction" }])
    expect(root.getAttribute("paused")).toBe(true)

    root.removePauseReason("modal-1")
    expect(root.getAttribute("paused")).toBe(false)
    expect(root.getAttribute("autofetch")).toBe(true)
  })

  it("initializes from visibility and resumes when the visible document is focused", () => {
    setVisibility("hidden")
    const playback = makePlaybackSDK()
    chart = playback.chart
    sdk = playback.sdk
    const root = sdk.getRoot()

    expect(root.getAttribute("blurred")).toBe(true)
    expect(root.getAttribute("paused")).toBe(true)

    setVisibility("visible")
    document.querySelector("button").focus()
    document.dispatchEvent(new Event("visibilitychange"))

    expect(root.getAttribute("blurred")).toBe(false)
    expect(root.getAttribute("paused")).toBe(false)
    expect(root.getAttribute("autofetch")).toBe(true)
  })

  it("removes browser listeners and its render timer when unregistered", () => {
    const playback = makePlaybackSDK()
    chart = playback.chart
    sdk = playback.sdk
    const root = sdk.getRoot()

    root.reconcilePlaybackState({ blurred: false })
    expect(jest.getTimerCount()).toBeGreaterThan(0)

    sdk.unregister("play")
    expect(jest.getTimerCount()).toBe(0)

    root.updateAttribute("blurred", false)
    window.dispatchEvent(new Event("blur"))
    expect(root.getAttribute("blurred")).toBe(false)

    sdk.unregister("hover")
    sdk = null
  })
})
