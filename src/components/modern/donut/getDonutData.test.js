import { makeTestChart } from "@jest/testUtilities"
import { makePayload } from "@/helpers/makeWavePayload"
import getDonutData, { otherId, formatWithUnit } from "./getDonutData"

const flat = value => Array.from({ length: 97 }, () => value)

const makeProtocolPayload = (values = [412, 188, 96, 54, 21]) =>
  makePayload({
    context: "test.traffic",
    title: "Traffic by protocol",
    unit: "GiB",
    dimensions: values.map((value, index) => ({ id: `p${index}`, values: flat(value) })),
  })

const loadChart = async (values, attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "d3pie", ...attributes } })
  chart.doneFetch(makeProtocolPayload(values))
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

describe("getDonutData", () => {
  it("returns no slices before data arrives", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "d3pie" } })

    expect(getDonutData(chart)).toEqual({ slices: [], total: 0 })
  })

  it("ranks visible dimensions by value with their share and colour", async () => {
    const chart = await loadChart([10, 30, 60])
    const { slices, total } = getDonutData(chart)

    expect(total).toBe(100)
    expect(slices.map(slice => slice.id)).toEqual(["p2", "p1", "p0"])
    expect(slices.map(slice => Math.round(slice.share))).toEqual([60, 30, 10])
    expect(slices[0].color).toBe(chart.selectDimensionColor("p2"))
  })

  it("groups everything after the top five into one slice, like the d3pie library", async () => {
    const chart = await loadChart([70, 60, 50, 40, 30, 20, 10])
    const { slices, total } = getDonutData(chart)

    expect(total).toBe(280)
    expect(slices).toHaveLength(6)
    expect(slices[5]).toMatchObject({
      id: otherId,
      name: "2 more",
      value: 30,
      grouped: ["p5", "p6"],
      color: chart.getThemeAttribute("themeD3pieSmallColor"),
    })
  })

  it("drops zero values and hidden dimensions", async () => {
    const chart = await loadChart([0, 30, 60])
    chart.toggleDimensionId("p1")

    expect(getDonutData(chart).slices.map(slice => slice.id)).toEqual(["p1"])
  })

  it("formats values with the chart units", async () => {
    const chart = await loadChart([10, 30, 60])

    expect(formatWithUnit(chart, 60, "p2")).toEqual({ value: "60", unit: "GiB" })
  })
})
