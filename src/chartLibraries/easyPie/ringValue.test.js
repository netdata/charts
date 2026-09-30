import { makeTestChart } from "@jest/testUtilities"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import { getRingValue, isModernFlavour, sumRow, toPercentage } from "./ringValue"

describe("ringValue helpers", () => {
  it("sums every dimension of a row and treats missing cells as zero", () => {
    expect(sumRow([1000, 1, 2, 3])).toBe(6)
    expect(sumRow([1000, undefined, 4])).toBe(4)
  })

  it("places the value inside the range", () => {
    expect(toPercentage(25, 0, 100)).toBe(25)
    expect(toPercentage(0, -50, 50)).toBe(50)
  })

  it("detects the modern flavour only", () => {
    const { chart } = makeTestChart()
    expect(isModernFlavour(chart)).toBe(false)

    chart.updateAttribute("designFlavour", "minimal")
    expect(isModernFlavour(chart)).toBe(false)

    chart.updateAttribute("designFlavour", "modern")
    expect(isModernFlavour(chart)).toBe(true)
  })
})

describe("getRingValue", () => {
  it("is empty until the chart loads", () => {
    const { chart } = makeTestChart()

    expect(getRingValue(chart)).toBeNull()
  })

  it("reads the latest row, or the hovered one, against the value range", async () => {
    const { chart } = makeTestChart()
    chart.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve, 0))

    const { data } = chart.getPayload()
    const [min, max] = chart.getAttribute("getValueRange")(chart)
    const latest = sumRow(data[data.length - 1])

    expect(getRingValue(chart)).toEqual({
      value: latest,
      min,
      max,
      percentage: toPercentage(latest, min, max),
    })

    chart.updateAttribute("hoverX", [data[0][0], null])
    expect(getRingValue(chart).value).toBe(sumRow(data[0]))
  })
})
