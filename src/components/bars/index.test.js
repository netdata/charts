import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload } from "@/helpers/makeWavePayload"
import { colors as annotationColors, enums as annotationEnums } from "@/helpers/annotations"
import { pillInk } from "@/components/modern/bars"
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

const renderBars = async (attributes = {}, data = payload) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "bars", ...attributes } })
  chart.doneFetch(data)
  await act(() => new Promise(resolve => setTimeout(resolve, 0)))
  renderWithChart(<BarsChart />, { chart })
  return chart
}

const decimalsPayload = makePayload({
  context: "test.apps.cpu",
  title: "Top processes by CPU",
  unit: "percentage",
  dimensions: [
    { id: "envoy", values: flat(64.1234) },
    { id: "node", values: flat(17.3459) },
    { id: "sshd", values: flat(3.99561) },
  ],
})

const annotatedPayload = () => {
  const data = makePayload({
    context: "test.apps.cpu",
    title: "Top processes by CPU",
    unit: "percentage",
    dimensions: [
      { id: "envoy", values: flat(64) },
      { id: "node", values: flat(41) },
    ],
  })
  const rows = data.result.data
  rows[rows.length - 1][1][2] = annotationEnums.O
  return data
}

const channel = value => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = color => {
  const [r, g, b] = color.startsWith("#")
    ? [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
    : color.match(/\d+/g).map(Number)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
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

    it("formats values with capped decimals and one shared unit", async () => {
      await renderBars({ designFlavour: "modern" }, decimalsPayload)

      const values = screen.getAllByTestId("modern-bars-value").map(el => el.textContent)
      expect(values).toEqual(["64.1", "17.3", "4"])
      screen.getAllByTestId("modern-bars-row").forEach(row => expect(row).toHaveTextContent(/%$/))
    })

    it("keeps user decimals in the bar values", async () => {
      await renderBars({ designFlavour: "modern", staticFractionDigits: 3 }, decimalsPayload)

      expect(screen.getAllByTestId("modern-bars-value")[2]).toHaveTextContent("3.996")
    })

    it("renders annotations as filled pills with dark ink in the full layout", async () => {
      await renderBars({ designFlavour: "modern", cols: "full" }, annotatedPayload())

      const [pill] = screen.getAllByTestId("modern-bars-annotation")
      expect(pill).toHaveTextContent("O")
      expect(pill).toHaveStyle({ color: pillInk })
    })

    it("keeps the pill ink at least 4.5:1 against every annotation colour", () => {
      Object.values(annotationColors).forEach(color =>
        expect(contrast(pillInk, color)).toBeGreaterThanOrEqual(4.5)
      )
    })

    it("leaves the anomaly rate out of the compact layout", async () => {
      await renderBars({ designFlavour: "modern" })

      expect(screen.queryByText("12.50%")).not.toBeInTheDocument()
    })
  })
})
