import makeChart from "./index"

jest.mock("@/helpers/makeKeyboardListener", () => () => ({
  onKeyChange: jest.fn(),
  initKeyboardListener: jest.fn(),
  clearKeyboardListener: jest.fn()
}))

jest.mock("@/helpers/makeExecuteLatest", () => () => ({
  add: jest.fn(fn => fn),
  clear: jest.fn()
}))

jest.mock("../makeNode", () => jest.fn(() => ({
  getAttributes: jest.fn(() => ({
    loaded: true,
    updateEvery: 1,
    after: -300,
    before: 0,
    autofetch: true,
    active: true,
    theme: "default"
  })),
  getAttribute: jest.fn(),
  updateAttribute: jest.fn(),
  updateAttributes: jest.fn(),
  trigger: jest.fn(),
  on: jest.fn(),
  onAttributeChange: jest.fn(),
  destroy: jest.fn(),
  match: jest.fn(),
  getAncestor: jest.fn(),
  getNodes: jest.fn(() => [])
})))

describe("makeChart", () => {
  let mockSdk
  let chart

  beforeEach(() => {
    mockSdk = {
      getRoot: jest.fn(() => ({
        getAttribute: jest.fn(() => Date.now())
      })),
      trigger: jest.fn(),
      ui: { dygraph: jest.fn() },
      makeChartCore: jest.fn(),
      makeChartUI: jest.fn(() => ({ unmount: jest.fn() }))
    }

    global.Date.now = jest.fn(() => 1000000000)
    global.clearTimeout = jest.fn()
    global.setTimeout = jest.fn()

    chart = makeChart({ sdk: mockSdk })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it("creates chart with required methods", () => {
    expect(chart).toHaveProperty("getUpdateEvery")
    expect(chart).toHaveProperty("getDateWindow")
    expect(chart).toHaveProperty("startAutofetch")
    expect(chart).toHaveProperty("getUI")
    expect(chart).toHaveProperty("setUI")
    expect(chart).toHaveProperty("focus")
    expect(chart).toHaveProperty("blur")
    expect(chart).toHaveProperty("activate")
    expect(chart).toHaveProperty("deactivate")
    expect(chart).toHaveProperty("getUnits")
    expect(chart).toHaveProperty("getThemeIndex")
    expect(chart).toHaveProperty("intl")
  })

  it("getUpdateEvery returns correct value when loaded", () => {
    chart.getAttributes.mockReturnValue({
      loaded: true,
      updateEvery: 5,
      viewUpdateEvery: null
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(5000)
  })

  it("getUpdateEvery returns viewUpdateEvery when available", () => {
    chart.getAttributes.mockReturnValue({
      loaded: true,
      updateEvery: 5,
      viewUpdateEvery: 10
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(10000)
  })

  it("getUpdateEvery returns 0 when not loaded", () => {
    chart.getAttributes.mockReturnValue({
      loaded: false,
      updateEvery: 5
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(0)
  })

  it("getThemeIndex returns correct index for theme", () => {
    chart.getAttribute.mockReturnValue("dark")

    const result = chart.getThemeIndex()
    expect(result).toBe(1)
  })

  it("getThemeIndex returns default for unknown theme", () => {
    chart.getAttribute.mockReturnValue("unknown")

    const result = chart.getThemeIndex()
    expect(result).toBe(0)
  })

  it("focus updates attributes and triggers events", () => {
    chart.getAttribute.mockReturnValue(false)

    chart.focus({ type: "focus" })

    expect(chart.updateAttributes).toHaveBeenCalledWith({ focused: true })
    expect(mockSdk.trigger).toHaveBeenCalledWith("hoverChart", expect.any(Object), { type: "focus" })
  })

  it("blur updates attributes and triggers events", () => {
    chart.getAttribute.mockReturnValue(true)

    chart.blur({ type: "blur" })

    expect(chart.updateAttributes).toHaveBeenCalledWith({ focused: false })
    expect(mockSdk.trigger).toHaveBeenCalledWith("blurChart", expect.any(Object), { type: "blur" })
  })

  it("activate sets active to true", () => {
    chart.activate()

    expect(chart.updateAttribute).toHaveBeenCalledWith("active", true)
    expect(mockSdk.trigger).toHaveBeenCalledWith("active", expect.any(Object), true)
  })

  it("deactivate sets active to false", () => {
    chart.deactivate()

    expect(chart.updateAttribute).toHaveBeenCalledWith("active", false)
    expect(mockSdk.trigger).toHaveBeenCalledWith("active", expect.any(Object), false)
  })

  it("getUnits returns units from attributes", () => {
    chart.getAttributes.mockReturnValue({ units: ["bytes", "MB"] })

    const result = chart.getUnits()
    expect(result).toEqual(["bytes", "MB"])
  })

  it("intl returns simple string for basic key", () => {
    chart.getAttribute.mockReturnValue({})

    const result = chart.intl("test_key")
    expect(result).toBe("test_key")
  })

  it("intl returns pluralized fallback", () => {
    chart.getAttribute.mockReturnValue({})

    const result = chart.intl("item", { count: 5, fallback: "item" })
    expect(result).toBe("items")
  })

  it("intl uses translation when available", () => {
    chart.getAttribute.mockReturnValue({
      test_key: "Translated Text"
    })

    const result = chart.intl("test_key")
    expect(result).toBe("Translated Text")
  })

  it("setUI and getUI work together", () => {
    const mockUI = { render: jest.fn() }
    
    chart.setUI(mockUI, "test")
    const result = chart.getUI("test")
    
    expect(result).toBe(mockUI)
  })

  it("makeSubChart creates new chart with UI", () => {
    const mockSubChart = { setUI: jest.fn() }
    mockSdk.makeChartCore.mockReturnValue(mockSubChart)

    const result = chart.makeSubChart({ id: "sub" })

    expect(mockSdk.makeChartCore).toHaveBeenCalledWith({ id: "sub" })
    expect(mockSubChart.setUI).toHaveBeenCalled()
  })
})