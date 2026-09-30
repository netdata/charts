import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DarkTheme } from "@netdata/netdata-ui"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { Gauge } from "@/components/gauge"
import { formatReadout } from "@/components/modern/format"
import { Attention } from "./index"
import {
  fitValueFontSize,
  unitFontSize,
  valueTextBox,
  valueRadius,
  valueBaseline,
} from "./geometry"

const green = ["#00AB44", "#00AB44"]
const yellow = ["#FFCC26", "#FFCC26"]
const red = ["#F95251", "#F95251"]

const load = async (attributes = {}, options = {}) => {
  const { chart } = makeTestChart({
    attributes: {
      chartLibrary: "gauge",
      designFlavour: "modern",
      staticValueRange: [0, 100],
      ...attributes,
    },
  })
  const result = renderWithChart(<Gauge />, { chart, ...options })
  await act(async () => {
    chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 50))
  })
  return { ...result, chart }
}

const lastSum = chart => {
  const { data } = chart.getPayload()
  const [, ...values] = data[data.length - 1]
  return values.reduce((acc, v = 0) => acc + v, 0)
}

describe("modern gauge", () => {
  it("shows a skeleton ring until loaded", () => {
    const { chart } = makeTestChart({
      attributes: { chartLibrary: "gauge", designFlavour: "modern" },
    })
    renderWithChart(<Gauge />, { chart })
    expect(screen.getByTestId("modernGauge-skeleton")).toBeInTheDocument()
    expect(document.querySelector("canvas")).toBeNull()
  })

  it("renders the SVG gauge instead of the canvas gauge", async () => {
    await load()

    expect(screen.getByTestId("modernGauge")).toBeInTheDocument()
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
    expect(document.querySelector("canvas")).toBeNull()
    expect(screen.getByTestId("modernGauge-track")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-value")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-knob")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-sparkline")).toBeInTheDocument()
  })

  it("shows the latest value, units and the value range", async () => {
    await load()

    const number = screen.getByTestId("modernGauge-number")
    expect(number.textContent).toMatch(/\d/)
    expect(number.querySelector("tspan")).not.toBeNull()
    const [value, unit] = number.childNodes
    expect(screen.getByTestId("modernGauge")).toHaveAttribute(
      "aria-label",
      `${value.textContent} ${unit.textContent}`
    )
    expect(screen.getByTestId("modernGauge-min").textContent).toMatch(/^0/)
    expect(screen.getByTestId("modernGauge-max").textContent).toMatch(/^100/)
  })

  it("respects the fraction digits setting", async () => {
    await load({ staticFractionDigits: 3 })

    const [value] = screen.getByTestId("modernGauge-number").childNodes
    expect(value.textContent).toMatch(/\.\d{3}$/)
  })

  it("draws warning and critical zones but not the base zone", async () => {
    await load({
      gaugeThresholds: [
        { id: "a", from: 0, color: green },
        { id: "b", from: 70, color: yellow },
        { id: "c", from: 90, color: red },
      ],
    })

    const zones = screen.getAllByTestId("modernGauge-zone")
    expect(zones.map(z => z.getAttribute("data-severity"))).toEqual(["warning", "critical"])
    expect(zones.map(z => z.getAttribute("stroke"))).toEqual(["#FFCC26", "#F95251"])
  })

  it("is quiet while the value sits in the base zone", async () => {
    await load({ gaugeThresholds: [{ id: "c", from: 95, color: red }] })

    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute("data-severity", "ok")
    expect(screen.getByText("Within thresholds")).toBeInTheDocument()
  })

  it("raises Critical and colours the arc when the value is inside a critical zone", async () => {
    const { chart } = await load({ gaugeThresholds: [{ id: "c", from: 1, color: red }] })

    expect(lastSum(chart)).toBeGreaterThan(1)
    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute("data-severity", "critical")
    expect(screen.getByText("Critical")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-knob")).toHaveAttribute("stroke", "#F95251")
  })

  it("raises Warning inside a warning zone", async () => {
    await load({ gaugeThresholds: [{ id: "b", from: 1, color: yellow }] })

    expect(screen.getByText("Warning")).toBeInTheDocument()
  })

  it("updates when thresholds change at runtime", async () => {
    const { chart } = await load()

    expect(screen.queryAllByTestId("modernGauge-zone")).toHaveLength(0)

    act(() => {
      chart.updateAttribute("gaugeThresholds", [{ id: "c", from: 1, color: red }])
    })

    expect(screen.getAllByTestId("modernGauge-zone")).toHaveLength(1)
    expect(screen.getByText("Critical")).toBeInTheDocument()
  })

  it("raises attention from payload alerts", async () => {
    const { chart } = await load()

    act(() => {
      chart.updateAttribute("alerts", { load_average_1: { nm: "load_average_1", wr: 1 } })
    })

    expect(screen.getByText("Warning")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-knob")).toHaveAttribute(
      "stroke",
      chart.selectDimensionColor()
    )
  })

  it("shows nothing when there are no thresholds and every alert is clear", async () => {
    const { chart } = await load()

    act(() => {
      chart.updateAttribute("alerts", { load_average_15: { nm: "load_average_15", cl: 1 } })
    })

    expect(screen.queryByTestId("modernGauge-attention")).toBeNull()
    expect(screen.queryByTestId("modernGauge-attentionRow")).toBeNull()
    expect(screen.queryByText("Within thresholds")).toBeNull()
  })

  it("stays quiet with thresholds even when alerts are clear", async () => {
    const { chart } = await load({ gaugeThresholds: [{ id: "c", from: 95, color: red }] })

    act(() => {
      chart.updateAttribute("alerts", { load_average_15: { nm: "load_average_15", cl: 1 } })
    })

    expect(screen.getByText("Within thresholds")).toBeInTheDocument()
  })

  it.each([
    ["within thresholds", [{ id: "c", from: 95, color: red }]],
    ["critical", [{ id: "c", from: 1, color: red }]],
  ])("keeps the attention in its own row above the dial when %s", async (name, thresholds) => {
    await load({ gaugeThresholds: thresholds })

    const row = screen.getByTestId("modernGauge-attentionRow")
    const content = screen.getByTestId("chartContent")
    expect(row).toContainElement(screen.getByTestId("modernGauge-attention"))
    expect(content).not.toContainElement(row)
    expect(screen.getByTestId("modernGauge")).not.toContainElement(row)
    expect(row.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(content).toHaveStyle({ flex: "1 1 0" })
  })

  it.each([
    ["ok", {}],
    ["critical", { gaugeThresholds: [{ id: "c", from: 1, color: red }] }],
    [
      "critical with long decimals",
      { staticFractionDigits: 6, gaugeThresholds: [{ id: "c", from: 1, color: red }] },
    ],
  ])("sizes the number to fit inside the arc (%s)", async (name, attributes) => {
    await load(attributes)

    const number = screen.getByTestId("modernGauge-number")
    const [value, unit] = number.childNodes
    const size = Number(number.getAttribute("font-size"))
    expect(size).toBe(fitValueFontSize(value.textContent, unit.textContent))
    expect(Number(unit.getAttribute("font-size"))).toBe(unitFontSize(size))
    const { width, height } = valueTextBox(value.textContent, unit.textContent, size)
    expect(Math.hypot(width / 2, valueBaseline + height)).toBeLessThanOrEqual(valueRadius)
    if (attributes.staticFractionDigits) expect(size).toBeLessThan(44)
  })

  it("formats the value and the range with the shared readout format", async () => {
    const { chart } = await load()
    const [dimensionId] = chart.getVisibleDimensionIds()
    const [latest] = chart.getPayload().data.slice(-1)[0].slice(1)

    const [value] = screen.getByTestId("modernGauge-number").childNodes
    expect(value.textContent).toBe(formatReadout(chart, latest, { dimensionId }))
    expect(screen.getByTestId("modernGauge-min").textContent).toBe(
      formatReadout(chart, 0, { dimensionId })
    )
    expect(screen.getByTestId("modernGauge-max").textContent).toBe(
      formatReadout(chart, 100, { dimensionId })
    )
  })

  it("applies the user decimals to the range labels too", async () => {
    await load({ staticFractionDigits: 3 })

    expect(screen.getByTestId("modernGauge-min").textContent).toBe("0.000")
    expect(screen.getByTestId("modernGauge-max").textContent).toBe("100.000")
  })

  it("renders in the dark theme", async () => {
    await load({ theme: "dark" }, { theme: DarkTheme })

    expect(screen.getByTestId("modernGauge")).toBeInTheDocument()
  })
})

describe("modern gauge attention", () => {
  const renderAttention = props => renderWithChart(<Attention {...props} />)

  it("renders nothing when quiet is not wanted", () => {
    const { container } = renderAttention({ severity: "ok", showQuiet: false })
    expect(container).toBeEmptyDOMElement()
  })

  it("names the severity", () => {
    renderAttention({ severity: "critical" })
    expect(screen.getByText("Critical")).toBeInTheDocument()
  })
})

describe("gauge flavours other than modern", () => {
  it.each(["default", "minimal"])("keeps the canvas gauge for %s", async designFlavour => {
    await load({ designFlavour, gaugeThresholds: [{ id: "c", from: 1, color: red }] })

    expect(document.querySelector("canvas")).not.toBeNull()
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
    expect(screen.queryByTestId("modernGauge")).toBeNull()
    expect(screen.queryByTestId("modernGauge-attention")).toBeNull()
    expect(screen.queryByText("Critical")).toBeNull()
  })

  it("swaps between the SVG and canvas gauge when the flavour changes at runtime", async () => {
    const { chart } = await load()
    expect(document.querySelector("canvas")).toBeNull()

    act(() => {
      chart.updateAttribute("designFlavour", "default")
    })
    expect(document.querySelector("canvas")).not.toBeNull()
    expect(screen.queryByTestId("modernGauge")).toBeNull()

    act(() => {
      chart.updateAttribute("designFlavour", "modern")
    })
    expect(document.querySelector("canvas")).toBeNull()
    expect(screen.getByTestId("modernGauge")).toBeInTheDocument()
  })

  it("keeps the default skeleton before load", () => {
    const { chart } = makeTestChart({ attributes: { chartLibrary: "gauge" } })
    renderWithChart(<Gauge />, { chart })
    expect(screen.queryByTestId("modernGauge-skeleton")).toBeNull()
  })
})
