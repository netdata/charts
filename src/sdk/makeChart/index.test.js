import { makeTestChart } from "@jest/testUtilities"

describe("makeChart", () => {
  let chart
  let sdk

  beforeEach(() => {
    const testChart = makeTestChart()
    chart = testChart.chart
    sdk = testChart.sdk
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

  it("setUI and getUI work together", () => {
    const mockUI = { test: true }
    chart.setUI(mockUI)
    expect(chart.getUI()).toBe(mockUI)
  })

  it("makeSubChart creates new chart with UI", () => {
    const subChart = chart.makeSubChart({ test: true })
    expect(subChart).toBeDefined()
    expect(typeof subChart.getUI).toBe("function")
    expect(typeof subChart.setUI).toBe("function")
    expect(subChart.getUI()).toBeDefined()
  })

  it("getUpdateEvery returns correct value when loaded", () => {
    chart.updateAttributes({
      loaded: true,
      updateEvery: 5,
      viewUpdateEvery: null,
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(5000)
  })

  it("getUpdateEvery returns viewUpdateEvery when available", () => {
    chart.updateAttributes({
      loaded: true,
      updateEvery: 5,
      viewUpdateEvery: 10,
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(10000)
  })

  it("getUpdateEvery returns 0 when not loaded", () => {
    chart.updateAttributes({
      loaded: false,
      updateEvery: 5,
    })

    const result = chart.getUpdateEvery()
    expect(result).toBe(0)
  })

  it("keeps live relative date window anchored between payload updates", () => {
    chart.updateAttributes({
      after: -300,
      before: 0,
      renderedAt: null,
      liveAnchor: 1000000,
    })
    sdk.getRoot().setAttribute("fetchAt", 1000500)

    expect(chart.getDateWindow()).toEqual([700000, 1000000])

    sdk.getRoot().setAttribute("fetchAt", 1001500)

    expect(chart.getDateWindow()).toEqual([700000, 1000000])
  })

  it("getThemeIndex returns correct index for theme", () => {
    chart.updateAttribute("theme", "dark")
    const result = chart.getThemeIndex()
    expect(result).toBe(1)
  })

  it("getThemeIndex returns default for unknown theme", () => {
    chart.updateAttribute("theme", "unknown")
    const result = chart.getThemeIndex()
    expect(result).toBe(0)
  })

  it("focus does not update when already focused and hovering", () => {
    chart.updateAttributes({ focused: true, hovering: true })
    const spy = jest.spyOn(chart, "updateAttributes")

    chart.focus({ type: "focus" })

    expect(spy).not.toHaveBeenCalled()
  })

  it("focus updates attributes", () => {
    chart.updateAttribute("focused", false)
    chart.updateAttribute("hovering", false)

    chart.focus({ type: "focus" })

    expect(chart.getAttribute("focused")).toBe(true)
    expect(chart.getAttribute("hovering")).toBe(true)
  })

  it("blur does not update when not focused or hovering", () => {
    chart.updateAttributes({ focused: false, hovering: false })
    const spy = jest.spyOn(chart, "updateAttributes")

    chart.blur({ type: "blur" })

    expect(spy).not.toHaveBeenCalled()
  })

  it("blur updates attributes", () => {
    chart.updateAttribute("focused", true)
    chart.updateAttribute("hovering", true)

    chart.blur({ type: "blur" })

    expect(chart.getAttribute("focused")).toBe(false)
    expect(chart.getAttribute("hovering")).toBe(false)
  })

  it("activate sets active to true", () => {
    chart.updateAttribute("active", false)

    chart.activate()

    expect(chart.getAttribute("active")).toBe(true)
  })

  it("deactivate sets active to false", () => {
    chart.updateAttribute("active", true)

    chart.deactivate()

    expect(chart.getAttribute("active")).toBe(false)
  })

  it("getUnits returns units from attributes", () => {
    chart.updateAttribute("units", "GB")
    const units = chart.getUnits()
    expect(units).toBe("GB")
  })

  it("formats seconds below one microsecond as nanoseconds", () => {
    chart.updateAttributes({
      units: ["s"],
      desiredUnits: ["auto"],
      secondsAsTime: true,
    })

    const unitAttributes = chart.getUnitAttributesForValue(25e-9)

    expect(unitAttributes.method).toBe("s-ns")
    expect(chart.getConvertedValueWithUnit(25e-9, { unitAttributes })).toBe("25 ns")
  })

  it("formats seconds below one millisecond with the micro sign", () => {
    chart.updateAttributes({
      units: ["s"],
      desiredUnits: ["auto"],
      secondsAsTime: true,
    })

    const unitAttributes = chart.getUnitAttributesForValue(5e-6)

    expect(unitAttributes.method).toBe("s-us")
    expect(chart.getUnitSign({ unitAttributes })).toBe("\u00b5s")
    expect(chart.getConvertedValueWithUnit(5e-6, { unitAttributes })).toBe("5 \u00b5s")
  })

  it("formats hour-range seconds as compact duration without a unit suffix", () => {
    chart.updateAttributes({
      units: ["s"],
      desiredUnits: ["auto"],
      secondsAsTime: true,
    })

    const unitAttributes = chart.getUnitAttributesForValue(33820.22)

    expect(unitAttributes.method).toBe("s-h:mm:ss")
    expect(chart.getUnitSign({ unitAttributes })).toBe("")
    expect(chart.getConvertedValueWithUnit(33820.22, { unitAttributes })).toBe("9h23m40s.22")
  })

  it("keeps high-precision latency values distinguishable by using a smaller scale", () => {
    chart.updateAttributes({
      units: ["s"],
      desiredUnits: ["auto"],
      secondsAsTime: true,
    })

    const min = 0.00512000001
    const max = 0.00512000009
    const unitAttributes = chart.getUnitAttributesForValue(min, { min, max })

    expect(unitAttributes.method).toBe("s-us")
    expect(unitAttributes.fractionDigits).toBe(5)
    expect(chart.getConvertedValueWithUnit(min, { unitAttributes })).toBe("5,120.00001 \u00b5s")
    expect(chart.getConvertedValueWithUnit(max, { unitAttributes })).toBe("5,120.00009 \u00b5s")
  })

  it("intl returns fallback when no translation", () => {
    const result = chart.intl("test.key", { fallback: "Default Text" })
    expect(result).toBe("Default Text")
  })

  it("intl returns pluralized key when count > 1", () => {
    const result = chart.intl("item", { count: 2, pluralize: true })
    expect(result).toBe("items")
  })

  it("intl uses translation when available", () => {
    chart.updateAttribute("en", {
      "test.key": "Translated Text",
    })
    const result = chart.intl("test.key")
    expect(result).toBe("Translated Text")
  })
})
