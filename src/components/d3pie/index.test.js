import React from "react"
import { act, fireEvent, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload } from "../../../fixtures/makeWavePayload"
import { formatReadout } from "@/components/modern/format"
import { getCenterFontSize } from "@/components/modern/donut"
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

const loadChart = async (designFlavour, data = payload) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "d3pie", designFlavour } })
  chart.doneFetch(data)
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

    it("caps the ring width so the legend keeps room for names", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      expect(screen.getByRole("img")).toHaveStyle({ maxWidth: "45%" })
    })

    it("lists the legend by label with name, bare value and share, naming the unit once", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const rows = screen.getAllByTestId("donut-legend-row")
      const names = rows.map(row => within(row).getByTestId("donut-legend-name").textContent)
      expect(names).toEqual(["grpc", "http", "https"])
      expect(within(rows[2]).getByTestId("donut-legend-value")).toHaveTextContent(/^60$/)
      expect(rows[2]).toHaveTextContent("60%")
      expect(rows[1]).toHaveTextContent("10%")
      rows.forEach(row => expect(row).not.toHaveTextContent("GiB"))
      expect(screen.getAllByText(/GiB/)).toHaveLength(1)
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("GiB total")
    })

    it("formats slice readouts like the default per-value readout", async () => {
      const chart = await loadChart(
        "modern",
        makePayload({
          context: "test.load",
          title: "Load",
          unit: "load",
          dimensions: [
            { id: "running", values: flat(449.12) },
            { id: "blocked", values: flat(31.7249) },
            { id: "waiting", values: flat(3.99561) },
          ],
        })
      )
      renderWithChart(<D3pie />, { chart })

      const readout = (value, dimensionId) =>
        chart.getConvertedValue(value, {
          dimensionId,
          unitAttributes: chart.getUnitAttributesForValue(value, { dimensionId }),
        })
      const values = screen.getAllByTestId("donut-legend-value").map(el => el.textContent)
      expect(values).toEqual([
        readout(31.7249, "blocked"),
        readout(449.12, "running"),
        readout(3.99561, "waiting"),
      ])
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("threads total")

      fireEvent.mouseEnter(screen.getAllByTestId("donut-legend-row")[2])
      expect(screen.getByTestId("donut-center-value")).toHaveTextContent(
        `${readout(3.99561, "waiting")} threads`
      )
    })

    it("keeps user decimals in the donut readouts", async () => {
      const { chart } = makeTestChart({
        attributes: { chartLibrary: "d3pie", designFlavour: "modern", staticFractionDigits: 3 },
      })
      chart.doneFetch(payload)
      await act(() => new Promise(resolve => setTimeout(resolve, 0)))
      renderWithChart(<D3pie />, { chart })

      expect(screen.getAllByTestId("donut-legend-value")[2]).toHaveTextContent("60.000")
    })

    it("truncates long dimension names with an ellipsis and keeps the full name in the title", async () => {
      const longName = "a-very-long-dimension-name-that-cannot-fit-the-legend"
      const chart = await loadChart(
        "modern",
        makePayload({
          context: "test.names",
          title: "Names",
          unit: "GiB",
          dimensions: [
            { id: "long", name: longName, values: flat(60) },
            { id: "short", values: flat(40) },
          ],
        })
      )
      renderWithChart(<D3pie />, { chart })

      const [row] = screen.getAllByTestId("donut-legend-row")
      expect(row).toHaveAttribute("title", longName)
      expect(within(row).getByTestId("donut-legend-name")).toHaveStyle({
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      })
    })

    it("switches the centre to the hovered slice and dims the rest", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const slices = screen.getAllByTestId("donut-slice")
      fireEvent.mouseEnter(slices[0])

      expect(screen.getByTestId("donut-center-value")).toHaveTextContent("30 GiB")
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("grpc, 30%")
      expect(slices[1]).toHaveAttribute("opacity", "0.25")
      expect(slices[0]).toHaveAttribute("opacity", "1")

      fireEvent.mouseLeave(slices[0])
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent("GiB total")
    })

    it("focuses a slice from its legend row", async () => {
      const chart = await loadChart("modern")
      renderWithChart(<D3pie />, { chart })

      const rows = screen.getAllByTestId("donut-legend-row")
      fireEvent.mouseEnter(rows[1])

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

      const unit = chart.getUnitSign()
      expect(screen.getByTestId("donut-center-value")).toHaveTextContent(
        formatReadout(chart, 1300000)
      )
      expect(screen.getByTestId("donut-center-caption")).toHaveTextContent(`${unit} total`)
      expect(unit).not.toBe("KiB")
    })
  })

  describe("getCenterFontSize", () => {
    it("keeps short readouts at full size and shrinks long ones to stay inside the ring", () => {
      expect(getCenterFontSize("449")).toBe(28)
      expect(getCenterFontSize("30.0 GiB")).toBeLessThan(28)
      expect(getCenterFontSize("4.00 processes per second")).toBe(14)
    })
  })
})
