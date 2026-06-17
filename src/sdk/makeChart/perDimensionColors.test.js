import { makeTestChart } from "@jest/testUtilities"

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
