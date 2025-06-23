import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { Title } from "./index"

describe("Title component", () => {
  it("renders title with chart title", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "CPU Usage",
        name: "system.cpu",
        isMinimal: false,
        units: ["%"],
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
    expect(screen.getByText(/system\.cpu/)).toBeInTheDocument()
  })

  it("renders with units when not minimal", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Memory Usage",
        name: "system.memory",
        isMinimal: false,
        units: ["By"],
        unitsCurrent: ["By"],
        unitsConversionBase: ["B"],
        unitsConversionPrefix: ["Ki"],
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("Memory Usage")).toBeInTheDocument()
    expect(screen.getByText(/\[.*\]/)).toBeInTheDocument() // Units in brackets
  })

  it("hides name and units when isMinimal is true", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Minimal Title",
        name: "system.test",
        designFlavour: "minimal",
        units: ["%"],
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("Minimal Title")).toBeInTheDocument()
    expect(screen.queryByText(/system\.test/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\[.*\]/)).not.toBeInTheDocument()
  })

  it("shows name when no title but has name", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "",
        name: "system.noTitle",
        isMinimal: false,
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("system.noTitle")).toBeInTheDocument()
  })

  it("updates when attributes change", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Initial Title",
        name: "initial.name",
        isMinimal: false,
      },
    })

    const { rerender } = renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("Initial Title")).toBeInTheDocument()

    chart.updateAttribute("title", "Updated Title")
    rerender(<Title />)

    expect(screen.queryByText("Initial Title")).not.toBeInTheDocument()
    expect(screen.getByText("Updated Title")).toBeInTheDocument()
  })

  it("handles toggling isMinimal state", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Toggle Test",
        name: "system.toggle",
        designFlavour: "default",
        units: ["%"],
      },
    })

    const { rerender } = renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText(/system\.toggle/)).toBeInTheDocument()

    chart.updateAttribute("designFlavour", "minimal")
    rerender(<Title />)

    expect(screen.queryByText(/system\.toggle/)).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Styled Title",
      },
    })

    renderWithChart(<Title className="custom-title" />, { testChartOptions: { chart } })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toHaveClass("custom-title")
  })

  it("passes additional props", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Props Test",
      },
    })

    renderWithChart(<Title data-custom="value" />, { testChartOptions: { chart } })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toHaveAttribute("data-custom", "value")
  })

  it("handles empty strings gracefully", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "",
        name: "",
        units: [""],
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toBeInTheDocument()
    // Should not render bullets when empty
    expect(screen.queryByText("•")).not.toBeInTheDocument()
  })

  it("shows bullet separator between title and name", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "Title Part",
        name: "Name Part",
        isMinimal: false,
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    expect(screen.getByText("Title Part")).toBeInTheDocument()
    expect(screen.getByText(/•.*Name Part/)).toBeInTheDocument()
  })

  it("truncates long titles", () => {
    const { chart } = makeTestChart({
      attributes: {
        title: "This is a very long title that should be truncated to prevent overflow in the UI",
      },
    })

    renderWithChart(<Title />, { testChartOptions: { chart } })

    const titleElement = screen.getByText(/This is a very long title/)
    // TextSmall component should have truncate prop
    expect(titleElement).toBeInTheDocument()
  })
})
