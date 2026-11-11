import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import withTile from "@/components/hocs/withTile"
import ModernNumber from "@/components/modern/number"
import ModernBars from "@/components/modern/bars"
import ModernDonut from "@/components/modern/donut"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"

const payload = makePayload({
  context: "modern.requests",
  title: "Requests",
  unit: "requests/s",
  dimensions: [
    { id: "get", values: makeWave({ center: 40, amplitude: 4 }) },
    { id: "post", values: makeWave({ center: 20, amplitude: 2 }) },
  ],
})

const loadChart = async () => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const px = value => parseFloat(value) || 0

const leftInset = (node, until) => {
  let inset = 0
  for (let current = node; current && current !== until.parentElement; ) {
    const style = getComputedStyle(current)
    inset += px(style.paddingLeft) + px(style.marginLeft)
    current = current.parentElement
  }
  return inset
}

const renderTiled = async Body => {
  const chart = await loadChart()
  const Tiled = withTile(Body)
  renderWithChart(<Tiled />, { chart })
  return screen.getByTestId("modernTile")
}

describe("modern tile body inset", () => {
  it("aligns the number value with the tile edge padding", async () => {
    const tile = await renderTiled(ModernNumber)

    expect(leftInset(screen.getByTestId("modernNumberValue"), tile)).toBe(12)
  })

  it("keeps the number inset when it is not inside a modern tile", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const body = screen.getByTestId("modernNumber")
    expect(leftInset(screen.getByTestId("modernNumberValue"), body)).toBe(12)
  })

  it("aligns the bar rows with the tile edge padding", async () => {
    const tile = await renderTiled(ModernBars)

    const [row] = screen.getAllByTestId("modern-bars-row")
    expect(leftInset(row.parentElement, tile)).toBe(12)
  })

  it("aligns the donut with the tile edge padding", async () => {
    const tile = await renderTiled(ModernDonut)

    expect(leftInset(screen.getByTestId("modern-donut"), tile)).toBe(12)
  })
})
