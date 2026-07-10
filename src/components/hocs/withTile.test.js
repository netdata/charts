import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeHeatmapPayload, renderWithChart } from "@jest/testUtilities"
import { Title } from "./withTile"

describe("tile title", () => {
  it("shows the normalized source unit", async () => {
    const { chart } = renderWithChart(<div />)
    const payload = makeHeatmapPayload(["storage"], [[1024]])
    payload.view.title = "Storage change"
    payload.view.chart_type = "number"
    payload.view.units = "KiB"
    payload.view.dimensions.units = ["KiB"]

    chart.doneFetch(payload)
    await new Promise(resolve => setTimeout(resolve, 0))

    renderWithChart(<Title />, { chart })

    expect(screen.getByText("Storage change")).toBeInTheDocument()
    expect(screen.getByText("• [bytes]")).toBeInTheDocument()
  })
})
