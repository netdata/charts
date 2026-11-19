import { makeTestChart } from "@jest/testUtilities"
import dimensionColors from "./theme/dimensionColors"

describe("per-dimension custom colors", () => {
  it("array form: a late-arriving dimension cannot receive a named custom color", () => {
    const { chart } = makeTestChart({ attributes: { colors: [] } })

    const initial = ["a", "b", "c", "d"].map(id => chart.selectDimensionColor(id))

    chart.updateAttribute("colors", ["#FF0000"])

    expect(chart.selectDimensionColor("e")).not.toBe("#FF0000")
    expect(chart.selectDimensionColor("a")).toBe(initial[0])
  })

  it("object form: late-arriving named dimensions receive their custom colors", () => {
    const { chart } = makeTestChart({ attributes: { colors: {} } })

    ;["a", "b", "c", "d"].forEach(id => chart.selectDimensionColor(id))

    chart.updateAttribute("colors", {
      e: "#FF0000",
      f: "#00FF00",
      g: "#0000FF",
      h: "#FFFF00",
      i: "#FF00FF",
    })

    expect(chart.selectDimensionColor("e")).toBe("#FF0000")
    expect(chart.selectDimensionColor("f")).toBe("#00FF00")
    expect(chart.selectDimensionColor("g")).toBe("#0000FF")
    expect(chart.selectDimensionColor("h")).toBe("#FFFF00")
    expect(chart.selectDimensionColor("i")).toBe("#FF00FF")
  })

  it("object form with numeric palette index resolves to a palette color", () => {
    const { chart } = makeTestChart({ attributes: { colors: { cpu: 2 } } })

    const color = chart.selectDimensionColor("cpu")

    expect(typeof color).toBe("string")
    expect(color).not.toBe("")
  })

  it("auto colors do not depend on arrival order", () => {
    const a1 = makeTestChart({ attributes: { colors: [] } }).chart
    const a2 = makeTestChart({ attributes: { colors: [] } }).chart

    a1.setAttribute("dimensionIds", ["b", "a"])
    a2.setAttribute("dimensionIds", ["a", "b"])
    a1.updateColors()
    a2.updateColors()

    expect(a1.selectDimensionColor("a")).toBe(a2.selectDimensionColor("a"))
    expect(a1.selectDimensionColor("b")).toBe(a2.selectDimensionColor("b"))
  })
})

describe("colorOverrides", () => {
  it("without overrides, colors and palette slots are unchanged", () => {
    const { sdk, chart } = makeTestChart({ attributes: { colors: { a: "#111111" } } })

    expect(chart.selectDimensionColor("a")).toBe("#111111")
    expect(chart.selectDimensionColor("b")).toBe(dimensionColors[0][0])

    const second = sdk.makeChart({ attributes: { colors: { a: "#111111" } } })
    sdk.appendChild(second)
    expect(second.selectDimensionColor("c")).toBe(dimensionColors[0][0])

    const positional = makeTestChart({ attributes: { colors: ["#111111", "#222222"] } }).chart
    expect(positional.selectDimensionColor()).toBe("#111111")
    expect(positional.selectDimensionColor("selected")).toBe("#111111")

    const sparkline = makeTestChart({
      attributes: { sparkline: true, colors: ["#333333", "#444444"] },
    }).chart
    expect(sparkline.selectDimensionColor("a")).toBe("#333333")
  })

  it("colorOverrides wins over a positional colors palette", () => {
    const { chart } = makeTestChart({
      attributes: { colors: ["#111111", "#222222"], colorOverrides: { b: "#FFD400" } },
    })

    expect(chart.selectDimensionColor("a")).toBe("#111111")
    expect(chart.selectDimensionColor("b")).toBe("#FFD400")
  })

  it("clearing colorOverrides restores the positional palette", () => {
    const { chart } = makeTestChart({
      attributes: { colors: ["#111111", "#222222"], colorOverrides: { b: "#FFD400" } },
    })

    expect(chart.selectDimensionColor("a")).toBe("#111111")
    expect(chart.selectDimensionColor("b")).toBe("#FFD400")

    chart.updateAttribute("colorOverrides", {})

    expect(chart.selectDimensionColor("b")).toBe("#222222")
  })

  it("an override does not shift other series' default colors on a fresh container", () => {
    const a = makeTestChart({ attributes: { colorOverrides: {} } }).chart
    const [aA, aB, aC] = ["a", "b", "c"].map(id => a.selectDimensionColor(id))

    const b = makeTestChart({ attributes: { colorOverrides: { a: "#FFD400" } } }).chart
    const [bA, bB, bC] = ["a", "b", "c"].map(id => b.selectDimensionColor(id))

    expect(aA).not.toBe("#FFD400")
    expect(bA).toBe("#FFD400")
    expect(bB).toBe(aB)
    expect(bC).toBe(aC)
  })

  it("exposes the non-overridden color through selectDefaultDimensionColor", () => {
    const { chart } = makeTestChart({
      attributes: { colors: ["#111111", "#222222"], colorOverrides: { b: "#FFD400" } },
    })

    chart.selectDimensionColor("a")

    expect(chart.selectDimensionColor("b")).toBe("#FFD400")
    expect(chart.selectDefaultDimensionColor("b")).toBe("#222222")
  })

  it("the selected key colors the aggregate", () => {
    const { chart } = makeTestChart({
      attributes: { selectedDimensions: [], colorOverrides: { selected: "#FFD400" } },
    })
    const seriesColor = chart.selectDimensionColor("a")

    expect(chart.selectDimensionColor()).toBe("#FFD400")

    chart.updateAttribute("selectedDimensions", ["b"])

    expect(chart.selectDimensionColor()).toBe("#FFD400")
    expect(chart.selectDimensionColor("a")).toBe(seriesColor)
    expect(seriesColor).not.toBe("#FFD400")
  })

  it("the aggregate ignores per-series overrides", () => {
    const { chart } = makeTestChart({
      attributes: {
        selectedDimensions: ["a"],
        colorOverrides: { a: "#111111", selected: "#FFD400" },
      },
    })

    expect(chart.selectDimensionColor()).toBe("#FFD400")

    chart.updateAttribute("colorOverrides", { a: "#111111" })

    expect(chart.selectDimensionColor()).toBe(chart.selectDefaultDimensionColor())
    expect(chart.selectDimensionColor()).not.toBe("#111111")
  })
})

describe("renderer palettes", () => {
  it("gives dygraph and uPlot charts the same palette", () => {
    const uplot = makeTestChart({ attributes: { chartLibrary: "uplot" } }).chart
    const dygraph = makeTestChart({ attributes: { chartLibrary: "dygraph" } }).chart

    expect(uplot.selectDimensionColor("a")).toBe(dimensionColors[0][0])
    expect(dygraph.selectDimensionColor("a")).toBe(dimensionColors[0][0])
  })

  it("resolves a numeric colour index against the shared palette", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "uplot", colors: { cpu: 2 } } })

    expect(chart.selectDimensionColor("cpu")).toBe(dimensionColors[2][0])
  })
})
