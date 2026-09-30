import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload } from "@/helpers/makeWavePayload"
import { BarsChart } from "./index"

const flat = value => Array.from({ length: 97 }, () => value)

const payload = makePayload({
  context: "test.apps.cpu",
  title: "Top processes by CPU",
  unit: "percentage",
  dimensions: [
    { id: "sshd", values: flat(1) },
    { id: "envoy", values: flat(64), anomalyRates: flat(12.5) },
    { id: "postgres", values: flat(27) },
    { id: "node", values: flat(41) },
  ],
})

const renderBars = async (attributes = {}) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "bars", ...attributes } })
  chart.doneFetch(payload)
  await act(() => new Promise(resolve => setTimeout(resolve, 0)))
  renderWithChart(<BarsChart />, { chart })
  return chart
}

const rowNames = () =>
  screen.getAllByTestId("modern-bars-row").map(row => within(row).getAllByText(/./)[0].textContent)

describe("BarsChart", () => {
  it.each(["default", "minimal"])("keeps the dimensions grid in %s", async designFlavour => {
    await renderBars({ designFlavour })

    expect(screen.getByText("Dimension")).toBeInTheDocument()
    expect(screen.getByText("Value")).toBeInTheDocument()
    expect(screen.getAllByTestId("chartPopover-dimension")).toHaveLength(4)
    expect(screen.queryByTestId("modern-bars")).not.toBeInTheDocument()
    expect(screen.queryByText("Anomaly%")).not.toBeInTheDocument()
  })

  it("keeps the anomaly and info columns in the default full layout", async () => {
    await renderBars({ designFlavour: "default", cols: "full" })

    expect(screen.getByText("Anomaly%")).toBeInTheDocument()
    expect(screen.getByText("Info")).toBeInTheDocument()
  })

  describe("modern", () => {
    it("ranks the bars by value without the grid header", async () => {
      await renderBars({ designFlavour: "modern" })

      expect(screen.getByTestId("modern-bars")).toBeInTheDocument()
      expect(screen.queryByText("Dimension")).not.toBeInTheDocument()
      expect(screen.queryByTestId("chartPopover-dimension")).not.toBeInTheDocument()
      expect(rowNames()).toEqual(["envoy", "node", "postgres", "sshd"])
    })

    it("shows name, value and units, and emphasises the top bar", async () => {
      await renderBars({ designFlavour: "modern" })

      const rows = screen.getAllByTestId("modern-bars-row")
      expect(rows[0]).toHaveTextContent("envoy")
      expect(within(rows[0]).getByTestId("modern-bars-value")).toHaveTextContent("64")
      expect(rows[0]).toHaveTextContent("%")

      const fills = screen.getAllByTestId("modern-bars-fill")
      expect(fills[0]).toHaveStyle({ opacity: "1" })
      expect(fills[1]).toHaveStyle({ opacity: "0.6" })
    })

    it("respects an explicit dimensionsSort", async () => {
      await renderBars({ designFlavour: "modern", dimensionsSort: "nameAsc" })

      expect(rowNames()).toEqual(["envoy", "node", "postgres", "sshd"].sort())
    })

    it("fades hidden dimensions and hides their value", async () => {
      const chart = await renderBars({ designFlavour: "modern" })

      act(() => chart.toggleDimensionId("envoy"))

      const rows = screen.getAllByTestId("modern-bars-row")
      expect(rows[0]).toHaveStyle({ opacity: "1" })
      expect(rows[1]).toHaveStyle({ opacity: "0.45" })
      expect(within(rows[1]).queryByTestId("modern-bars-value")).not.toBeInTheDocument()
    })

    it("shows a non-empty anomaly rate only in the full layout", async () => {
      await renderBars({ designFlavour: "modern", cols: "full" })

      const rows = screen.getAllByTestId("modern-bars-row")
      expect(rows[0]).toHaveTextContent("12.50%")
      expect(screen.getAllByText(/^\d+\.\d+%$/)).toHaveLength(1)
    })

    it("leaves the anomaly rate out of the compact layout", async () => {
      await renderBars({ designFlavour: "modern" })

      expect(screen.queryByText("12.50%")).not.toBeInTheDocument()
    })
  })
})
