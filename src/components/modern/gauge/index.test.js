import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DarkTheme } from "@netdata/netdata-ui"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { Gauge } from "@/components/gauge"
import { formatReadout, formatReadoutUnit } from "@/components/modern/format"
import { makePayload } from "../../../../fixtures/makeWavePayload"
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
    expect(
      screen
        .getByTestId("modernGauge")
        .getAttribute("aria-label")
        .startsWith(`${value.textContent} ${unit.textContent}. `)
    ).toBe(true)
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

  it("is a quiet dot while the value sits in the base zone", async () => {
    await load({ gaugeThresholds: [{ id: "c", from: 95, color: red }] })

    const status = screen.getByTestId("modernGauge-attention")
    expect(status).toHaveAttribute("data-severity", "ok")
    expect(status).toHaveAttribute("data-status", "clear")
    expect(status).toHaveTextContent(/^$/)
    expect(status.getAttribute("aria-label")).toMatch(/^Within the gauge thresholds/)
    expect(screen.queryByText("Within thresholds")).toBeNull()
  })

  it("raises Critical and colours the arc when the value is inside a critical zone", async () => {
    const { chart } = await load({ gaugeThresholds: [{ id: "c", from: 1, color: red }] })

    expect(lastSum(chart)).toBeGreaterThan(1)
    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute("data-severity", "critical")
    expect(screen.getByText("Critical")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute(
      "aria-label",
      expect.stringContaining("The value is in a critical zone of the gauge thresholds")
    )
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

    expect(screen.getByText("1 warning")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute(
      "aria-label",
      "1 warning, load_average_1"
    )
    expect(screen.getByTestId("modernGauge-knob")).toHaveAttribute(
      "stroke",
      chart.selectDimensionColor()
    )
  })

  it("shows a quiet dot when there are no thresholds and every alert is clear", async () => {
    const { chart } = await load()

    act(() => {
      chart.updateAttribute("alerts", { load_average_15: { nm: "load_average_15", cl: 1 } })
    })

    const status = screen.getByTestId("modernGauge-attention")
    expect(status).toHaveAttribute("data-status", "clear")
    expect(status).toHaveAttribute("aria-label", "1 alert watches this chart, none is raised")
  })

  it("shows nothing without thresholds or alerts", async () => {
    const { chart } = await load()

    act(() => {
      chart.updateAttribute("alerts", {})
    })

    expect(screen.queryByTestId("modernGauge-attention")).toBeNull()
    expect(screen.queryByTestId("modernGauge-attentionRow")).toBeNull()
  })

  it("describes both thresholds and clear alerts on the quiet dot", async () => {
    const { chart } = await load({ gaugeThresholds: [{ id: "c", from: 95, color: red }] })

    act(() => {
      chart.updateAttribute("alerts", { load_average_15: { nm: "load_average_15", cl: 1 } })
    })

    expect(screen.getByTestId("modernGauge-attention")).toHaveAttribute(
      "aria-label",
      "Within the gauge thresholds. 1 alert watches this chart, none is raised"
    )
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
    await load({ valueFocus: "totals", ...attributes })

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
    const edge = value =>
      `${formatReadout(chart, value, { dimensionId })} ${formatReadoutUnit(chart, value, { dimensionId })}`
    expect(screen.getByTestId("modernGauge-min").textContent).toBe(edge(0))
    expect(screen.getByTestId("modernGauge-max").textContent).toBe(edge(100))
  })

  it("applies the user decimals to the range labels too", async () => {
    await load({ staticFractionDigits: 3 })

    expect(screen.getByTestId("modernGauge-min").textContent).toMatch(/^0\.000 /)
    expect(screen.getByTestId("modernGauge-max").textContent).toMatch(/^100\.000 /)
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
    const { chart } = await load({
      designFlavour,
      gaugeThresholds: [{ id: "c", from: 1, color: red }],
    })
    act(() => chart.updateAttribute("alerts", { disk_full: { nm: "disk_full", cr: 1 } }))

    expect(document.querySelector("canvas")).not.toBeNull()
    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
    expect(screen.queryByTestId("modernGauge")).toBeNull()
    expect(screen.queryByTestId("modernGauge-attention")).toBeNull()
    expect(screen.queryByText("Critical")).toBeNull()
    expect(screen.queryByTestId("modernStatus-dot")).toBeNull()
    expect(screen.queryByText("1 critical")).toBeNull()
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

describe("gauge value focus", () => {
  const percent = values =>
    makePayload({
      context: "modern.disk",
      title: "Disk used",
      unit: "%",
      dimensions: [{ id: "used", values }],
    })
  const rising = percent([...Array(48).fill(58), ...Array(49).fill(81.2)])
  const flat = percent(Array(97).fill(72.4))

  const loadFocus = async (payload, attributes = {}) => {
    const { chart } = makeTestChart({
      attributes: {
        chartLibrary: "gauge",
        designFlavour: "modern",
        staticValueRange: [0, 100],
        ...attributes,
      },
    })
    chart.doneFetch(payload)
    const result = renderWithChart(<Gauge />, { chart })
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })
    return { ...result, chart }
  }

  const sizeOf = node => parseFloat(node.getAttribute("font-size"))

  it("shows only the gauge in totals", async () => {
    await loadFocus(rising, { valueFocus: "totals" })

    expect(screen.getByTestId("modernGauge-value")).toBeInTheDocument()
    expect(screen.getByTestId("modernGauge-number")).toHaveTextContent("81.2%")
    expect(screen.getByTestId("modernGauge")).toHaveAttribute("aria-label", "81.2 %")
    expect(screen.queryByTestId("modernGauge-delta")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernGauge-ghost")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernGauge-sparkline")).not.toBeInTheDocument()
  })

  describe("changes", () => {
    it("ghosts the arc from the window start with a start tick", async () => {
      await loadFocus(rising, { valueFocus: "changes" })

      expect(screen.getByTestId("modernGauge-ghost").getAttribute("stroke")).toMatch(/^url\(#.+\)$/)
      expect(screen.getByTestId("modernGauge-startTick")).toBeInTheDocument()
      expect(screen.getByTestId("modernGauge-value")).toBeInTheDocument()
      expect(screen.queryByTestId("modernGauge-sparkline")).not.toBeInTheDocument()
    })

    it("makes the delta the hero with the value smaller under it", async () => {
      await loadFocus(rising, { valueFocus: "changes" })

      const delta = screen.getByTestId("modernGauge-delta")
      expect(delta).toHaveTextContent(/^\+23\.2%$/)
      expect(screen.getByTestId("modernGauge-fromTo")).toHaveTextContent("58 → 81.2%")
      expect(sizeOf(delta)).toBeGreaterThan(sizeOf(screen.getByTestId("modernGauge-fromTo")) * 1.5)
      expect(screen.getByTestId("modernGauge-arrow")).toHaveAttribute("aria-hidden", "true")
      expect(screen.getByTestId("modernGauge-arrow")).toHaveAttribute("data-direction", "up")
      expect(screen.queryByTestId("modernGauge-number")).not.toBeInTheDocument()
      expect(screen.getByTestId("modernGauge")).toHaveAttribute(
        "aria-label",
        "Up 23.2% in 8 min, from 58 to 81.2"
      )
    })

    it("says No change and the steady value on a flat window", async () => {
      await loadFocus(flat, { valueFocus: "changes" })

      expect(screen.getByTestId("modernGauge-noChange")).toHaveTextContent("No change")
      expect(screen.getByTestId("modernGauge-steady")).toHaveTextContent("steady at 72.4%")
      expect(screen.getByTestId("modernGauge")).toHaveAttribute(
        "aria-label",
        "No change in 8 min, steady at 72.4"
      )
      expect(screen.queryByTestId("modernGauge-ghost")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernGauge-startTick")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernGauge-delta")).not.toBeInTheDocument()
    })
  })

  describe("trends", () => {
    it("draws a larger mini trend with start and end dots and the value and delta smaller", async () => {
      await loadFocus(rising, { valueFocus: "trends" })

      const sparkline = screen.getByTestId("modernGauge-sparkline")
      expect(sparkline).toHaveAttribute("data-width", "150")
      expect(sparkline).toHaveAttribute("data-height", "44")
      expect(sparkline.querySelector("title")).toHaveTextContent("58 → 81.2, +23.2% in 8 min")
      expect(screen.getByTestId("modernGauge-sparkStart")).toBeInTheDocument()
      expect(screen.getByTestId("modernGauge-sparkEnd")).toBeInTheDocument()
      expect(screen.getByTestId("modernGauge-delta")).toHaveTextContent("+23.2% in 8 min")
      expect(sizeOf(screen.getByTestId("modernGauge-number"))).toBeLessThanOrEqual(34)
      expect(screen.getByTestId("modernGauge")).toHaveAttribute(
        "aria-label",
        "81.2 %. Up 23.2% in 8 min, from 58 to 81.2"
      )
    })

    it("draws a flat window as a dashed line", async () => {
      await loadFocus(flat, { valueFocus: "trends" })

      expect(screen.getByTestId("modernGauge-sparkline")).toHaveAttribute("data-flat", "true")
      expect(
        screen.getByTestId("modernGauge-sparkline").querySelector("[stroke-dasharray]")
      ).not.toBeNull()
      expect(screen.getByTestId("modernGauge-delta")).toHaveTextContent("no change in 8 min")
    })

    it("shrinks the trend before the text on a small tile", async () => {
      const { chart } = makeTestChart({
        attributes: {
          chartLibrary: "gauge",
          designFlavour: "modern",
          staticValueRange: [0, 100],
          valueFocus: "trends",
        },
      })
      chart.getUI().getChartWidth = () => 170
      chart.getUI().getChartHeight = () => 110
      chart.doneFetch(rising)
      renderWithChart(<Gauge />, { chart })
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const scale = Math.min(170 / 240, 110 / 200)
      const sparkline = screen.getByTestId("modernGauge-sparkline")
      expect(Number(sparkline.getAttribute("data-width"))).toBeLessThan(150)
      expect(Number(sparkline.getAttribute("data-height"))).toBeLessThan(44)
      expect(sizeOf(screen.getByTestId("modernGauge-delta")) * scale).toBeGreaterThanOrEqual(11)
    })

    it("is the default", async () => {
      const { chart } = await loadFocus(rising)

      expect(chart.getAttribute("valueFocus")).toBeNull()
      expect(screen.getByTestId("modernGauge-sparkline")).toBeInTheDocument()
      expect(screen.getByTestId("modernGauge-delta")).toBeInTheDocument()
    })
  })
})
