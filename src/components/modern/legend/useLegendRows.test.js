import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import { LineSwatch } from "@/components/modern/swatch"
import { useLegendRows } from "./useLegendRows"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

const Swatches = () => {
  const { rows } = useLegendRows()
  return rows.map(row => <LineSwatch key={row.id} swatchColor={row.color} />)
}

const loadChart = async () => {
  const { chart } = makeTestChart()
  await act(async () => {
    chart.doneFetch(systemLoadLine[0])
    await tick()
  })
  return chart
}

const firstSwatch = () => screen.getAllByTestId("modernLegend-swatch")[0]

describe("useLegendRows", () => {
  it("legend swatch follows a colorOverrides change", async () => {
    const chart = await loadChart()
    const [id] = chart.getDimensionIds()
    const original = chart.selectDimensionColor(id)
    renderWithChart(<Swatches />, { chart })

    expect(firstSwatch()).toHaveStyle({ background: original })

    act(() => chart.updateAttribute("colorOverrides", { [id]: "#123456" }))
    expect(firstSwatch()).toHaveStyle({ background: "#123456" })

    act(() => chart.updateAttribute("colorOverrides", {}))
    expect(firstSwatch()).toHaveStyle({ background: original })
  })

  it("an override survives a theme switch", async () => {
    const chart = await loadChart()
    const [id] = chart.getDimensionIds()
    renderWithChart(<Swatches />, { chart })

    act(() => chart.updateAttribute("colorOverrides", { [id]: "#123456" }))
    act(() => chart.updateAttribute("theme", "dark"))

    expect(firstSwatch()).toHaveStyle({ background: "#123456" })
  })
})
