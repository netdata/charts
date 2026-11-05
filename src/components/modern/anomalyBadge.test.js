import React from "react"
import { act, fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../fixtures/makeWavePayload"
import AnomalyBadge from "./anomalyBadge"

const anomalyPayload = rate =>
  makePayload({
    context: "anomaly.cpu",
    title: "CPU",
    unit: "percentage",
    dimensions: [
      {
        id: "user",
        values: makeWave({ center: 50, amplitude: 30 }),
        anomalyRates: Array.from({ length: 97 }, (_, index) => rate(index)),
      },
    ],
  })

const renderBadge = async rate => {
  const { chart } = makeTestChart({
    attributes: { designFlavour: "modern", chartLibrary: "uplot" },
  })
  chart.doneFetch(anomalyPayload(rate))
  await act(() => new Promise(resolve => setTimeout(resolve, 0)))
  chart.getUI().getPlotArea = () => ({ left: 40, top: 24, width: 600, height: 200 })
  renderWithChart(<AnomalyBadge />, { chart })
  return chart
}

describe("Modern anomaly badge", () => {
  it("stays away when the window is calm", async () => {
    await renderBadge(() => 0)

    expect(screen.queryByTestId("modernAnomalyBadge")).not.toBeInTheDocument()
  })

  it("spotlights on hover and opens Correlate for the whole window on click", async () => {
    const chart = await renderBadge(index => (index === 40 ? 42 : index === 80 ? 12 : 0))
    const badge = screen.getByTestId("modernAnomalyBadge")

    expect(badge).toHaveTextContent("42%")

    const anchor = screen.getByTestId("modernAnomalyBadge-anchor")
    fireEvent.mouseEnter(anchor)
    expect(chart.getAttribute("anomalySpotlight")).toBe(true)
    fireEvent.mouseLeave(anchor)
    expect(chart.getAttribute("anomalySpotlight")).toBe(false)

    fireEvent.click(badge)
    expect(chart.getAttribute("drawer.action")).toBe("correlate")
    expect(chart.getAttribute("drawer.tab")).toBe("window")
    expect(chart.getAttribute("expanded")).toBe(true)
  })
})
