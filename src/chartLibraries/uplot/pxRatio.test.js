import uPlot from "uplot"
import { makeTestChart } from "@jest/testUtilities"
import uplotChart from "./index"
import getPxRatio from "./pxRatio"

const withPxRatio = async (ratio, run) => {
  const previous = uPlot.pxRatio
  uPlot.pxRatio = ratio
  try {
    return await run()
  } finally {
    uPlot.pxRatio = previous
  }
}

const countYTicks = async () => {
  const { sdk, chart } = makeTestChart({ attributes: { loaded: true, chartType: "line" } })
  chart.getPayload = () => ({
    data: [
      [1617946860000, 0, 3],
      [1617946865000, 50, 70],
      [1617946870000, 90, 100],
    ],
    labels: ["time", "a", "b"],
  })
  chart.getPayloadDimensionIds = () => ["a", "b"]
  chart.getVisibleDimensionIds = () => ["a", "b"]
  chart.isDimensionVisible = () => true

  const instance = uplotChart(sdk, chart)
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "600px"
  document.body.appendChild(element)
  instance.mount(element)
  await Promise.resolve()
  await Promise.resolve()

  const count = instance.getUPlot().axes[1]._splits.length
  instance.unmount()
  document.body.removeChild(element)
  return count
}

describe("uPlot pixel ratio", () => {
  it("reads the ratio uPlot keeps on its constructor", async () => {
    await withPxRatio(2, () => expect(getPxRatio()).toBe(2))
    await withPxRatio(undefined, () => expect(getPxRatio()).toBe(1))
  })

  it("spaces y-axis labels in CSS pixels on high-density screens", async () => {
    const atOne = await withPxRatio(1, countYTicks)
    const atTwo = await withPxRatio(2, countYTicks)

    expect(atTwo).toBeLessThan(atOne)
  })
})
