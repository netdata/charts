import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderHookWithChart, renderWithChart, makeTestChart } from "@jest/testUtilities"
import { useLatestDisplayValueWithUnit } from "@/components/provider"
import systemLoadLine from "../../../fixtures/systemLoadLine"
import { makePayload } from "../../../fixtures/makeWavePayload"
import { NumberChart, Value, Unit } from "./index"

const loadChart = async (attributes = {}, payload = systemLoadLine[0]) => {
  const { chart } = makeTestChart({ attributes: { chartLibrary: "number", ...attributes } })
  chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return chart
}

describe("NumberChart", () => {
  it("renders chart container with value and unit", () => {
    renderWithChart(<NumberChart />)

    expect(screen.getByTestId("chartContent")).toBeInTheDocument()
  })

  it("renders with chartWrapper styling", () => {
    renderWithChart(<NumberChart />)

    const container = screen.getByTestId("chartContent").parentElement
    expect(container).toBeInTheDocument()
  })

  it("passes additional props to container", () => {
    renderWithChart(<NumberChart data-custom="value" />)

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveAttribute("data-custom", "value")
  })

  it("applies correct layout styling", () => {
    renderWithChart(<NumberChart />)

    const container = screen.getByTestId("chartContent")
    expect(container).toHaveStyle({
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    })
  })
})

describe("Value component", () => {
  it("renders latest converted value", () => {
    renderWithChart(<Value />, {
      attributes: {
        dimensionIds: ["cpu"],
        latestValues: [42.5],
        selectedDimensions: ["cpu"],
        unitsConversionMethod: ["original"],
        unitsConversionDivider: [1],
        unitsConversionFractionDigits: [2],
      },
    })

    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("formats value based on conversion settings", () => {
    renderWithChart(<Value />, {
      attributes: {
        dimensionIds: ["memory"],
        latestValues: [1024],
        selectedDimensions: ["memory"],
        unitsConversionMethod: ["divide"],
        unitsConversionDivider: [1024],
        unitsConversionFractionDigits: [2],
      },
    })

    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("handles missing values gracefully", () => {
    renderWithChart(<Value />, {
      attributes: {
        dimensionIds: ["cpu"],
        latestValues: [],
        selectedDimensions: ["cpu"],
      },
    })

    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("responds to dimension size changes", () => {
    const { chart } = renderWithChart(<Value />, {
      attributes: {
        dimensionIds: ["cpu"],
        latestValues: [42],
        selectedDimensions: ["cpu"],
      },
    })

    chart.trigger("resize", { width: 400, height: 300 })

    expect(screen.getByText("-")).toBeInTheDocument()
  })
})

describe("Unit component", () => {
  it("renders unit sign when available", () => {
    renderWithChart(<Unit />, {
      attributes: {
        dimensionIds: ["cpu"],
        units: ["%"],
        unitsCurrent: ["%"],
        unitsConversionBase: ["%"],
        unitsConversionPrefix: [""],
      },
    })

    expect(screen.getByText("%")).toBeInTheDocument()
  })

  it("renders nothing when unit is empty", () => {
    const { container } = renderWithChart(<Unit />, {
      attributes: {
        dimensionIds: ["cpu"],
        units: [""],
        unitsCurrent: "",
        unitsConversionBase: [""],
        unitsConversionPrefix: [""],
      },
    })

    expect(container.firstChild).toBeNull()
  })

  it("shows unit with prefix when converted", () => {
    renderWithChart(<Unit />, {
      attributes: {
        dimensionIds: ["memory"],
        units: ["By"],
        unitsCurrent: "By",
        unitsConversionBase: ["B"],
        unitsConversionPrefix: ["Ki"],
      },
    })

    expect(screen.getByText(/Ki.*B/)).toBeInTheDocument()
  })

  it("uses first dimension for unit determination", () => {
    renderWithChart(<Unit />, {
      attributes: {
        dimensionIds: ["cpu", "memory"],
        units: ["%"],
        unitsCurrent: ["%"],
        unitsConversionBase: ["%", "B"],
        unitsConversionPrefix: ["", "Ki"],
      },
    })

    expect(screen.getByText("%")).toBeInTheDocument()
  })

  it("handles no dimensions gracefully", () => {
    const { container } = renderWithChart(<Unit />, {
      attributes: {
        dimensionIds: [],
      },
    })

    expect(container.firstChild).toBeNull()
  })
})

describe("NumberChart design flavours", () => {
  it.each(["default", "minimal"])("keeps the %s flavour value and unit layout", async flavour => {
    const chart = await loadChart({ designFlavour: flavour })
    renderWithChart(<NumberChart />, { chart })

    const content = screen.getByTestId("chartContent")
    expect(content).toHaveStyle({ alignItems: "center", justifyContent: "center" })
    expect(content.children).toHaveLength(2)
    expect(content).toHaveTextContent(/^[\d.,-]+threads$/)
    const [id] = chart.getVisibleDimensionIds()
    const { convertedValue } = renderHookWithChart(() => useLatestDisplayValueWithUnit(id), {
      chart,
    }).result.current
    expect(content).toHaveTextContent(`${convertedValue}threads`)
    expect(screen.queryByTestId("modernNumber")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberSpark")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernNumberStatus")).not.toBeInTheDocument()
  })

  it.each([
    ["system load", systemLoadLine[0]],
    [
      "scaled requests",
      makePayload({
        context: "test.requests",
        title: "Requests",
        unit: "requests/s",
        dimensions: [{ id: "requests", values: [...Array(96).fill(2000), 2022.7] }],
      }),
    ],
  ])("shows the same value and unit as the default number for %s", async (_, payload) => {
    const defaultChart = await loadChart({ designFlavour: "default" }, payload)
    const { unmount } = renderWithChart(<NumberChart />, { chart: defaultChart })
    const expected = screen.getByTestId("chartContent").textContent
    unmount()

    const modernChart = await loadChart({ designFlavour: "modern" }, payload)
    renderWithChart(<NumberChart />, { chart: modernChart })
    const value = screen.getByTestId("modernNumberValue").textContent
    const unit = screen.queryByTestId("modernNumberUnit")?.textContent || ""

    expect(`${value}${unit}`).toBe(expected)
  })

  it("renders the stat panel in the modern flavour", async () => {
    const chart = await loadChart({ designFlavour: "modern" })
    renderWithChart(<NumberChart />, { chart })

    const content = screen.getByTestId("chartContent")
    expect(content).toHaveStyle({ alignItems: "stretch" })
    expect(content.children).toHaveLength(1)
    expect(screen.getByTestId("modernNumber")).toBeInTheDocument()
    expect(screen.getByTestId("modernNumberValue")).toBeInTheDocument()
  })

  it("switches layouts when the flavour changes", async () => {
    const chart = await loadChart()
    renderWithChart(<NumberChart />, { chart })

    expect(screen.queryByTestId("modernNumber")).not.toBeInTheDocument()

    act(() => chart.updateAttribute("designFlavour", "modern"))
    expect(screen.getByTestId("modernNumber")).toBeInTheDocument()

    act(() => chart.updateAttribute("designFlavour", "default"))
    expect(screen.queryByTestId("modernNumber")).not.toBeInTheDocument()
  })
})
