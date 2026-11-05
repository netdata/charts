import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeHeatmapPayload, renderWithChart } from "@jest/testUtilities"
import { Title } from "./withTile"

const renderTitle = async hideUnits => {
  const { chart } = renderWithChart(<div />)
  const payload = makeHeatmapPayload(["storage"], [[1024]])
  payload.view.title = "Storage change"
  payload.view.chart_type = "number"
  payload.view.units = "KiB"
  payload.view.dimensions.units = ["KiB"]

  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))

  if (hideUnits !== undefined) chart.updateAttribute("hideUnits", hideUnits)

  renderWithChart(<Title />, { chart })
}

describe("tile title", () => {
  it("hides the source unit by default, leaving the full width to the title", async () => {
    await renderTitle()

    expect(screen.getByText("Storage change")).toBeInTheDocument()
    expect(screen.queryByText("• [bytes]")).not.toBeInTheDocument()
  })

  it("shows the source unit when hideUnits is explicitly false", async () => {
    await renderTitle(false)

    expect(screen.getByText("Storage change")).toBeInTheDocument()
    expect(screen.getByText("• [bytes]")).toBeInTheDocument()
  })

  it("hides the source unit when hideUnits is explicitly true", async () => {
    await renderTitle(true)

    expect(screen.getByText("Storage change")).toBeInTheDocument()
    expect(screen.queryByText("• [bytes]")).not.toBeInTheDocument()
  })
})
