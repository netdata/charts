import unitConversion from "./index"
import { getConversionAttributes } from "./getConversionUnits"
import convert from "@/helpers/units"
import { makeTestChart } from "@jest/testUtilities"

const makeChart = attributes => {
  const { chart } = makeTestChart({
    attributes: {
      unitsStsByContext: {},
      dbUnitsStsByContext: {},
      ...attributes,
    },
  })

  return chart
}

const read = (chart, units, { min, max }) => {
  const unitAttributes = getConversionAttributes(chart, units, { min, max })

  return {
    method: unitAttributes.method,
    label: chart.getUnitSign({ unitAttributes }),
    convert: value => convert(chart, unitAttributes.method, value, unitAttributes.divider),
  }
}

describe("temperature preference", () => {
  describe("unset (default) renders whatever the agent reported", () => {
    it("leaves Celsius sources in Celsius", () => {
      const chart = makeChart({ units: ["Cel"], desiredUnits: ["auto"] })

      const { method, label, convert: c } = read(chart, "Cel", { min: 0, max: 100 })

      expect(method).toBe("original")
      expect(label).toBe("°C")
      expect(c(100)).toBe(100)
    })

    it("leaves Fahrenheit sources in Fahrenheit", () => {
      const chart = makeChart({ units: ["[degF]"], desiredUnits: ["auto"] })

      const { method, label, convert: c } = read(chart, "[degF]", { min: 32, max: 212 })

      expect(method).toBe("original")
      expect(label).toBe("°F")
      expect(c(212)).toBe(212)
    })
  })

  describe("fahrenheit", () => {
    it("converts Celsius sources", () => {
      const chart = makeChart({
        units: ["Cel"],
        desiredUnits: ["auto"],
        temperature: "fahrenheit",
      })

      const { method, label, convert: c } = read(chart, "Cel", { min: 0, max: 100 })

      expect(method).toBe("Cel-[degF]")
      expect(label).toBe("°F")
      expect(c(0)).toBe(32)
      expect(c(100)).toBe(212)
    })

    it("leaves Fahrenheit sources alone", () => {
      const chart = makeChart({
        units: ["[degF]"],
        desiredUnits: ["auto"],
        temperature: "fahrenheit",
      })

      const { method, label, convert: c } = read(chart, "[degF]", { min: 32, max: 212 })

      expect(method).toBe("original")
      expect(label).toBe("°F")
      expect(c(212)).toBe(212)
    })
  })

  describe("celsius", () => {
    it("converts Fahrenheit sources", () => {
      const chart = makeChart({
        units: ["[degF]"],
        desiredUnits: ["auto"],
        temperature: "celsius",
      })

      const { method, label, convert: c } = read(chart, "[degF]", { min: 32, max: 212 })

      expect(method).toBe("[degF]-Cel")
      expect(label).toBe("°C")
      expect(c(32)).toBe(0)
      expect(c(212)).toBe(100)
    })

    it("leaves Celsius sources alone", () => {
      const chart = makeChart({
        units: ["Cel"],
        desiredUnits: ["auto"],
        temperature: "celsius",
      })

      const { method, label, convert: c } = read(chart, "Cel", { min: 0, max: 100 })

      expect(method).toBe("original")
      expect(label).toBe("°C")
      expect(c(100)).toBe(100)
    })
  })

  describe("per-chart selection overrides the preference", () => {
    it("converts to Fahrenheit while the preference says celsius", () => {
      const chart = makeChart({
        units: ["Cel"],
        desiredUnits: ["[degF]"],
        temperature: "celsius",
      })

      const { method, label, convert: c } = read(chart, "Cel", { min: 0, max: 100 })

      expect(method).toBe("Cel-[degF]")
      expect(label).toBe("°F")
      expect(c(100)).toBe(212)
    })

    it("keeps source units when the chart asks for no conversion", () => {
      const chart = makeChart({
        units: ["Cel"],
        desiredUnits: ["original"],
        temperature: "fahrenheit",
      })

      const { method, label, convert: c } = read(chart, "Cel", { min: 0, max: 100 })

      expect(method).toBe("original")
      expect(label).toBe("°C")
      expect(c(100)).toBe(100)
    })

    it("honours an explicit choice regardless of the data magnitude", () => {
      const chart = makeChart({ units: ["h"], desiredUnits: ["ns"] })

      expect(read(chart, "h", { min: 0, max: 1000 }).method).toBe("h-ns")
      expect(read(chart, "h", { min: 0, max: 1e9 }).method).toBe("h-ns")
    })
  })

  describe("changing the preference recomputes conversion", () => {
    const makeStaticRangeChart = () =>
      makeChart({
        units: ["Cel"],
        dbUnits: ["Cel"],
        desiredUnits: ["auto"],
        staticValueRange: [0, 100],
        dimensionIds: ["temp"],
        visibleDimensionIds: ["temp"],
      })

    it("switches to Fahrenheit when the preference is set", () => {
      const chart = makeStaticRangeChart()
      unitConversion(chart)
      chart.trigger("yAxisChange")

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["original"])

      chart.updateAttribute("temperature", "fahrenheit")

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["Cel-[degF]"])
    })

    it("switches back when the preference is cleared", () => {
      const chart = makeStaticRangeChart()
      unitConversion(chart)
      chart.updateAttribute("temperature", "fahrenheit")

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["Cel-[degF]"])

      chart.updateAttribute("temperature", undefined)

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["original"])
    })

    it("recomputes when secondsAsTime changes", () => {
      const chart = makeChart({
        units: ["s"],
        dbUnits: ["s"],
        desiredUnits: ["auto"],
        staticValueRange: [0, 3700],
        secondsAsTime: true,
        dimensionIds: ["uptime"],
        visibleDimensionIds: ["uptime"],
      })
      unitConversion(chart)
      chart.trigger("yAxisChange")

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["s-h:mm:ss"])

      chart.updateAttribute("secondsAsTime", false)

      expect(chart.getAttribute("unitsConversionMethod")).toEqual(["original"])
    })
  })
})
