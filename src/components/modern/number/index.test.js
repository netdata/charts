import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme } from "@netdata/netdata-ui"
import { makeTestChart, renderHookWithChart, renderWithChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import { formatReadout } from "@/components/modern/format"
import { makePayload, makeWave } from "../../../../fixtures/makeWavePayload"
import { NumberChart } from "@/components/number"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import { describeWindowChange } from "@/helpers/valueFocus"
import ModernNumber, { isStateUnit } from "./index"

const readLatest = (chart, id) =>
  renderHookWithChart(() => useLatestDisplayValueWithUnit(id), { chart }).result.current

const loadChart = async (attributes = {}, payload = systemLoadLine[0]) => {
  const { chart } = makeTestChart({
    attributes: { designFlavour: "modern", locale: "en-US", ...attributes },
  })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

const requests = values =>
  makePayload({
    context: "modern.requests",
    title: "Requests",
    unit: "requests/s",
    dimensions: [{ id: "requests", values }],
  })

const rgbToHex = rgb =>
  `#${rgb
    .match(/\d+/g)
    .slice(0, 3)
    .map(n => Number(n).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase()

describe("isStateUnit", () => {
  it.each([["{state}"], ["status"], [["{boolean}"]], ["{ntp mode}"]])(
    "treats %p as a state",
    units => expect(isStateUnit(units)).toBe(true)
  )

  it.each([["requests/s"], [["%"]], [""], [undefined]])("treats %p as a measure", units =>
    expect(isStateUnit(units)).toBe(false)
  )
})

describe("ModernNumber", () => {
  it("shows the latest value, units, change across the window and the window sparkline", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { value, convertedUnit, unitAttributes } = readLatest(chart, id)

    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(
      formatReadout(chart, value, { dimensionId: id, unitAttributes })
    )
    expect(screen.getByTestId("modernNumberUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(/^[+−].+ in \d+ min$/)
    expect(screen.getByTestId("modernNumberSpark")).toBeInTheDocument()
    expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("100%")
    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
  })

  it("shows no window change for a state metric", async () => {
    const chart = await loadChart({}, requests(makeWave({ center: 1, amplitude: 1 })))
    act(() => chart.updateAttribute("units", ["{state}"]))
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.getByTestId("modernNumberValue")).toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
  })

  it("shows no status when the chart has no alerts", async () => {
    const chart = await loadChart({}, requests(makeWave({ center: 10, amplitude: 2 })))
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
  })

  it("renders the value in the numerals font with tabular numerals", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const value = screen.getByTestId("modernNumberValue")
    expect(value).toHaveStyle({ fontVariantNumeric: "tabular-nums" })
    expect(getComputedStyle(value).fontFamily).toContain("IBM Plex Sans Condensed")
  })

  it("computes the delta against the window start", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { all } = chart.getPayload()
    const values = all.map((_, i) => chart.getDimensionValue(id, i, { abs: false }))
    const delta = values[values.length - 1] - values[0]
    const sign = delta >= 0 ? "+" : "−"

    const { unitAttributes } = readLatest(chart, id)
    const converted = formatReadout(chart, Math.abs(delta), { dimensionId: id, unitAttributes })

    expect(screen.getByTestId("modernNumberDelta").textContent).toMatch(/ in \d+ min$/)
    expect(
      screen.getByTestId("modernNumberDelta").textContent.startsWith(`${sign}${converted} in `)
    ).toBe(true)
    expect(screen.getByTestId("modernNumberDelta")).not.toHaveTextContent("vs mean")
  })

  it("shows the value with the same digits as the default number chart", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const [id] = chart.getVisibleDimensionIds()
    const { convertedValue } = readLatest(chart, id)

    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(convertedValue)
  })

  it("scales thousands on the same unit as the default number chart", async () => {
    const chart = await loadChart(
      {},
      requests([...Array(48).fill(2000), ...Array(49).fill(2022.7)])
    )
    renderWithChart(<ModernNumber />, { chart })

    const { convertedValue, convertedUnit } = readLatest(chart, "requests")
    expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(convertedValue)
    expect(screen.getByTestId("modernNumberUnit")).toHaveTextContent(convertedUnit)
    expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(/^\+.+ in \d+ min$/)
  })

  it("keeps the decimals the user chose", async () => {
    const chart = await loadChart({ staticFractionDigits: 4 })
    renderWithChart(<ModernNumber />, { chart })

    expect(screen.getByTestId("modernNumberValue").textContent).toMatch(/\.\d{4}$/)
    expect(screen.getByTestId("modernNumberDelta").textContent).toMatch(/\.\d{4} in \d+ min$/)
  })

  it("moves the marker with the hovered point", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    const { all } = chart.getPayload()
    act(() => chart.updateAttribute("hoverX", [all[0][0], null]))

    expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("0%")
  })

  it("keeps the value size once the widest value has been shown", async () => {
    const chart = await loadChart({}, requests([...Array(96).fill(123456.789), 2]))
    chart.getUI().getChartWidth = () => 110
    chart.getUI().getChartHeight = () => 200
    renderWithChart(<ModernNumber />, { chart })
    const size = () => getComputedStyle(screen.getByTestId("modernNumberValue")).fontSize
    const { all } = chart.getPayload()

    act(() => chart.updateAttribute("hoverX", [all[0][0], null]))
    const widest = size()

    act(() => chart.updateAttribute("hoverX", [all[all.length - 1][0], null]))
    expect(size()).toBe(widest)

    act(() => chart.updateAttribute("hoverX", null))
    expect(size()).toBe(widest)
  })

  it("shows the warning status and tone when an alert is raised", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", wr: 1 } }))

    const status = screen.getByTestId("modernNumberStatus")
    expect(status).toHaveAttribute("data-status", "warning")
    expect(status).toHaveTextContent("1 warning")
    expect(rgbToHex(getComputedStyle(screen.getByTestId("modernNumberValue")).color)).toBe(
      DefaultTheme.colors.warning
    )
  })

  it("shows critical as the prominent status", async () => {
    const chart = await loadChart()
    renderWithChart(<ModernNumber />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 2 } }))

    const status = screen.getByTestId("modernNumberStatus")
    expect(status).toHaveAttribute("data-status", "critical")
    expect(status).toHaveTextContent("2 critical")
    expect(rgbToHex(getComputedStyle(status).backgroundColor)).toBe(DefaultTheme.colors.error)
  })

  it("renders a placeholder before data arrives", () => {
    renderWithChart(<ModernNumber />, { attributes: { designFlavour: "modern" } })

    expect(screen.getByTestId("modernNumber")).toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
  })
})

describe("number colour assignment", () => {
  it("does not take a colour slot before data arrives", async () => {
    const { chart: early } = makeTestChart({ attributes: { designFlavour: "modern" } })
    renderWithChart(<ModernNumber />, { chart: early })
    early.doneFetch(systemLoadLine[0])
    await act(() => new Promise(resolve => setTimeout(resolve, 0)))

    const { chart: plain } = makeTestChart({ attributes: { designFlavour: "default" } })
    plain.doneFetch(systemLoadLine[0])
    await new Promise(resolve => setTimeout(resolve, 0))

    plain
      .getDimensionIds()
      .forEach(id => expect(early.selectDimensionColor(id)).toBe(plain.selectDimensionColor(id)))
  })
})

describe("number status in other flavours", () => {
  it.each(["default", "minimal"])("renders no status for %s with raised alerts", async flavour => {
    const chart = await loadChart({ designFlavour: flavour })
    renderWithChart(<NumberChart />, { chart })

    act(() => chart.updateAttribute("alerts", { load: { nm: "load", cr: 1 } }))

    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernStatus-dot")).not.toBeInTheDocument()
    expect(screen.queryByText("1 critical")).not.toBeInTheDocument()
  })
})

describe("number value focus", () => {
  const rising = requests([...Array(48).fill(40), ...Array(49).fill(48)])
  const falling = requests([...Array(48).fill(64), ...Array(49).fill(62)])
  const flat = requests(Array(97).fill(48))
  const spike = requests([...Array(30).fill(40), ...Array(37).fill(90), ...Array(30).fill(40)])
  const percent = values =>
    makePayload({
      context: "modern.cpu",
      title: "CPU",
      unit: "percentage",
      dimensions: [{ id: "requests", values }],
    })
  const transfer = values =>
    makePayload({
      context: "modern.io",
      title: "IO",
      unit: "KiB/s",
      dimensions: [{ id: "requests", values }],
    })

  const describeChange = chart => {
    const values = chart
      .getPayload()
      .all.map((_, i) => chart.getDimensionValue("requests", i, { abs: false }))
    const { unitAttributes } = readLatest(chart, "requests")
    return describeWindowChange(chart, values, { dimensionId: "requests", unitAttributes })
  }

  const sized = async (attributes, payload, { width = 240, height = 160 } = {}) => {
    const chart = await loadChart(attributes, payload)
    chart.getUI().getChartWidth = () => width
    chart.getUI().getChartHeight = () => height
    renderWithChart(<ModernNumber />, { chart })
    return chart
  }

  const fontSize = testId => parseFloat(getComputedStyle(screen.getByTestId(testId)).fontSize)

  describe("totals", () => {
    it("shows the value huge and alone", async () => {
      const chart = await sized({ valueFocus: "totals" }, rising)

      expect(screen.getByTestId("modernNumberValue")).toHaveTextContent(
        readLatest(chart, "requests").convertedValue
      )
      expect(fontSize("modernNumberValue")).toBeGreaterThan(44)
      expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernNumberHero")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    })
  })

  describe("changes", () => {
    it("makes the neutral-coloured delta the hero with the value smaller under it", async () => {
      const chart = await sized({ valueFocus: "changes" }, rising)
      const change = describeChange(chart)

      const hero = screen.getByTestId("modernNumberHero")
      expect(hero).toHaveAttribute("role", "img")
      expect(hero).toHaveAttribute("aria-label", change.label)
      expect(change.label).toMatch(/^Up 8\S* in 8 min, from 40\S* to 48\S*$/)
      expect(within(hero).getByTestId("modernNumberDelta")).toHaveTextContent(change.delta)
      expect(rgbToHex(getComputedStyle(screen.getByTestId("modernNumberDelta")).color)).toBe(
        DefaultTheme.colors.text
      )
      expect(within(hero).getByTestId("modernNumberArrow")).toHaveAttribute("aria-hidden", "true")
      expect(within(hero).getByTestId("modernNumberArrow")).toHaveAttribute("data-direction", "up")
      expect(screen.getByTestId("modernNumberFromTo")).toHaveTextContent(
        `${change.from} → now ${change.to} · 8 min`
      )
      expect(fontSize("modernNumberDelta")).toBeGreaterThan(fontSize("modernNumberFromTo") * 2)
      expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    })

    it("points the arrow down on a decrease", async () => {
      await sized({ valueFocus: "changes" }, falling)

      expect(screen.getByTestId("modernNumberDelta").textContent).toMatch(/^−2/)
      expect(screen.getByTestId("modernNumberArrow")).toHaveAttribute("data-direction", "down")
    })

    it("drops the now and the window on a narrow tile", async () => {
      const chart = await sized({ valueFocus: "changes" }, rising, { width: 170 })
      const change = describeChange(chart)

      expect(screen.getByTestId("modernNumberFromTo")).toHaveTextContent(
        new RegExp(`^${change.from} → ${change.to}$`)
      )
    })

    it("says No change and the steady value on a flat window", async () => {
      const chart = await sized({ valueFocus: "changes" }, flat)
      const { convertedValue, convertedUnit } = readLatest(chart, "requests")

      const hero = screen.getByTestId("modernNumberHero")
      expect(hero).toHaveTextContent(/^No change/)
      expect(hero).toHaveAttribute("aria-label", `No change in 8 min, steady at ${convertedValue}`)
      expect(screen.getByTestId("modernNumberSteady")).toHaveTextContent(
        `steady at ${convertedValue}${convertedUnit || ""} · 8 min`
      )
      expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernNumberArrow")).not.toBeInTheDocument()
    })

    it("says No change without calling a window that moved steady", async () => {
      const chart = await sized({ valueFocus: "changes" }, spike)
      const { convertedValue } = readLatest(chart, "requests")

      const hero = screen.getByTestId("modernNumberHero")
      expect(hero).toHaveTextContent(/^No change/)
      expect(hero).not.toHaveTextContent("steady")
      expect(hero).toHaveAttribute("aria-label", `No change in 8 min, now at ${convertedValue}`)
    })

    it("writes the percent sign once on a percentage delta", async () => {
      await sized(
        { valueFocus: "changes" },
        percent([...Array(48).fill(40), ...Array(49).fill(60)])
      )

      expect(screen.getByTestId("modernNumberHero").textContent).toMatch(/^\+20%40/)
    })

    it("writes both ends of the change in the shown unit", async () => {
      const chart = await sized(
        { valueFocus: "changes" },
        transfer([...Array(48).fill(1), ...Array(49).fill(2048)])
      )
      const { unitAttributes } = readLatest(chart, "requests")
      const from = formatReadout(chart, 1, { dimensionId: "requests", unitAttributes })

      expect(screen.getByTestId("modernNumberFromTo")).toHaveTextContent(
        new RegExp(
          `^${from} → now ${formatReadout(chart, 2048, { dimensionId: "requests", unitAttributes })}`
        )
      )
      expect(from).not.toBe("1")
    })

    it("measures the delta at the hovered point", async () => {
      const chart = await sized({ valueFocus: "changes" }, rising)
      const { all } = chart.getPayload()

      act(() => chart.updateAttribute("hoverX", [all[10][0], null]))

      expect(screen.getByTestId("modernNumberHero")).toHaveTextContent(/^No change/)
    })
  })

  describe("trends", () => {
    it("makes the sparkline the hero with start and end dots", async () => {
      await sized({ valueFocus: "trends" }, rising)

      const spark = screen.getByTestId("modernNumberSpark")
      expect(parseFloat(getComputedStyle(spark).height)).toBe(96)
      expect(screen.getByTestId("modernNumberSparkStart").style.left).toBe("0%")
      expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("100%")
      expect(spark).not.toHaveAttribute("data-flat")
    })

    it("shows the value small with the delta beside it", async () => {
      const chart = await sized({ valueFocus: "trends" }, rising)

      expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent(describeChange(chart).text)
      expect(fontSize("modernNumberValue")).toBeLessThan(24)
      expect(screen.queryByTestId("modernNumberHero")).not.toBeInTheDocument()
    })

    it("draws a dashed line and the steady text on a flat window", async () => {
      const chart = await sized({ valueFocus: "trends" }, flat)
      const { convertedValue, convertedUnit } = readLatest(chart, "requests")

      const spark = screen.getByTestId("modernNumberSpark")
      expect(spark).toHaveAttribute("data-flat", "true")
      expect(spark.querySelector("[stroke-dasharray]")).not.toBeNull()
      expect(screen.getByTestId("modernNumberSteady")).toHaveTextContent(
        `steady at ${convertedValue}${convertedUnit || ""} · 8 min`
      )
      expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
    })

    it("draws the shape of a window that moved and came back", async () => {
      await sized({ valueFocus: "trends" }, spike)

      expect(screen.getByTestId("modernNumberSpark")).not.toHaveAttribute("data-flat")
      expect(screen.queryByTestId("modernNumberSteady")).not.toBeInTheDocument()
      expect(screen.getByTestId("modernNumberDelta")).toHaveTextContent("no change in 8 min")
    })

    it("is the default", async () => {
      const chart = await sized({}, rising)

      expect(chart.getAttribute("valueFocus")).toBeNull()
      expect(screen.getByTestId("modernNumberDelta")).toBeInTheDocument()
      expect(screen.getByTestId("modernNumberSparkStart")).toBeInTheDocument()
    })
  })

  it("switches marks when the attribute changes", async () => {
    const chart = await sized({}, rising)

    act(() => chart.updateAttribute("valueFocus", "totals"))

    expect(screen.queryByTestId("modernNumberDelta")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
  })
})
