import { makeTestChart } from "@jest/testUtilities"

describe("pristine", () => {
  it("changing colorOverrides marks the chart not pristine; reverting clears it", () => {
    const { chart } = makeTestChart({ attributes: { colorOverrides: {} } })

    chart.updateAttribute("colorOverrides", { a: "#FFD400" })

    expect(chart.getAttribute("pristine")).toEqual({ colorOverrides: {} })

    chart.updateAttribute("colorOverrides", {})

    expect(chart.getAttribute("pristine")).toEqual({})
  })
})
