import React from "react"
import { act, fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload } from "@/helpers/makeWavePayload"
import { formatWithUnit } from "@/components/modern/donut/getDonutData"
import { D3pie } from "./index"

const flat = value => Array.from({ length: 97 }, () => value)

const payload = makePayload({
  context: "test.traffic",
  title: "Traffic by protocol",
  unit: "GiB",
  dimensions: [
    { id: "https", values: flat(60) },
    { id: "grpc", values: flat(30) },
    { id: "http", values: flat(10) },
  ],
})

const loadChart = async designFlavour => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "d3pie", designFlavour } })
  chart.doneFetch(payload)
  await act(() => new Promise(resolve => setTimeout(resolve, 0)))
  return chart
}

describe("D3pie", () => {
  it.each(["default", "minimal", "modern"])(
    "shows the skeleton before data in %s",
    designFlavour => {
      const { chart } = makeTestChart({ attributes: { chartLibrary: "d3pie", designFlavour } })
      const { container } = renderWithChart(<D3pie />, { chart })

      expect(screen.queryByTestId("chartContent")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modern-donut")).not.toBeInTheDocument()
      expect(container.firstChild.children).toHaveLength(1)
    }
  )

  it.each(["default", "minimal"])(
    "keeps the d3pie library rendering in %s, with no modern donut",
    async designFlavour => {
      const chart = await loadChart(designFlavour)

      // jsdom has no SVG layout, so reaching getBBox proves the d3pie library drew its SVG.
      expect(() => renderWithChart(<D3pie />, { chart })).toThrow("getBBox")
      expect(screen.queryByTestId("modern-donut")).not.toBeInTheDocument()
    }
  )

  describe("modern", () => {
    it("renders the donut with a slice and legend row per dimension and the total", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      expect(screen.getByTestId("chartContent")).toBeInTheDocument()
      expect(screen.getByTestId("modern-donut")).toBeInTheDocument()
      expect(screen.getAllByTestId("donut-slice")).toHaveLength(3)
      expect(screen.getAllByTestId("donut-legend-row")).toHaveLength(3)
      expect(screen.getByTestId("donut-center-value")).toHaveTextContent("100")
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("GiB total")
      expect(chart.getUI().getElement().querySelector(".d3pie")).toBeNull()
    })

    it("lists the legend by value with value, unit and share", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const rows = screen.getAllByTestId("donut-legend-row")
      expect(rows[0]).toHaveTextContent("https")
      expect(rows[0]).toHaveTextContent("60 GiB")
      expect(rows[0]).toHaveTextContent("60%")
      expect(rows[2]).toHaveTextContent("http")
      expect(rows[2]).toHaveTextContent("10%")
    })

    it("switches the centre to the hovered slice and dims the rest", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const slices = screen.getAllByTestId("donut-slice")
      fireEvent.mouseEnter(slices[1])

      expect(screen.getByTestId("donut-center-value")).toHaveTextContent("30 GiB")
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("grpc, 30%")
      expect(slices[0]).toHaveAttribute("opacity", "0.25")
      expect(slices[1]).toHaveAttribute("opacity", "1")

      fireEvent.mouseLeave(slices[1])
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("GiB total")
    })

    it("focuses a slice from its legend row", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const rows = screen.getAllByTestId("donut-legend-row")
      fireEvent.mouseEnter(rows[2])

      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("http, 10%")
      expect(screen.getAllByTestId("donut-slice")[0]).toHaveAttribute("opacity", "0.25")
      expect(rows[0]).toHaveStyle({ opacity: "0.4" })
    })

    it("follows hidden dimensions", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      act(() => chart.toggleDimensionId("https"))

      expect(screen.getAllByTestId("donut-legend-row")).toHaveLength(1)
      expect(screen.getByTestId("donut-center-value")).toHaveTextContent("60")
    })

    it("scales the centre total and its unit together", async () => {
      const { chart } = makeTestChart({
        attributes: { chartLibrary: "d3pie", designFlavour: "modern" },
      })
      chart.doneFetch(
        makePayload({
          context: "test.bytes",
          title: "Bytes",
          unit: "KiB",
          dimensions: [
            { id: "a", values: flat(700000) },
            { id: "b", values: flat(600000) },
          ],
        })
      )
      await act(() => new Promise(resolve => setTimeout(resolve, 0)))
      renderWithChart(<D3pie />, { chart })

      const { value, unit } = formatWithUnit(chart, 1300000)
      expect(screen.getByTestId("donut-center-value")).toHaveTextContent(value)
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent(`${unit} total`)
      expect(unit).not.toBe("KiB")
    })
  })
})
