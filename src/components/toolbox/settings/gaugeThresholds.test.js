import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import GaugeThresholds from "./gaugeThresholds"

const gauge = () => ({ attributes: { chartLibrary: "gauge" } })

describe("GaugeThresholds settings", () => {
  it("renders nothing for non-gauge charts", () => {
    renderWithChart(<GaugeThresholds />, { attributes: { chartLibrary: "dygraph" } })
    expect(screen.queryByText("Value thresholds")).not.toBeInTheDocument()
  })

  it("adds a threshold row and stores it on the attribute", async () => {
    const { chart, user } = renderWithChart(<GaugeThresholds />, gauge())
    await user.click(screen.getByRole("button", { name: /add threshold/i }))
    const stored = chart.getAttribute("gaugeThresholds")
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ from: 0 })
    expect(Array.isArray(stored[0].color)).toBe(true)
  })

  it("removes a row", async () => {
    const { chart, user } = renderWithChart(<GaugeThresholds />, {
      attributes: {
        chartLibrary: "gauge",
        gaugeThresholds: [{ id: "x", from: 90, color: ["#F95251", "#F95251"] }],
      },
    })
    await user.click(screen.getByRole("button", { name: /remove threshold/i }))
    expect(chart.getAttribute("gaugeThresholds")).toBeNull()
  })
})
