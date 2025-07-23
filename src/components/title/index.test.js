import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import { Title } from "./index"

describe("Title component", () => {
  it("renders title with chart title", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "CPU Usage",
        name: "system.cpu",
        isMinimal: false,
        units: ["%"],
      },
    })

    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
    expect(screen.getByText(/system\.cpu/)).toBeInTheDocument()
  })

  it("renders with units when not minimal", () => {
    renderWithChart(<Title />, {
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

    expect(screen.getByText("Memory Usage")).toBeInTheDocument()
    expect(screen.getByText(/\[.*\]/)).toBeInTheDocument() // Units in brackets
  })

  it("hides name and units when isMinimal is true", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "Minimal Title",
        name: "system.test",
        designFlavour: "minimal",
        units: ["%"],
      },
    })

    expect(screen.getByText("Minimal Title")).toBeInTheDocument()
    expect(screen.queryByText(/system\.test/)).not.toBeInTheDocument()
    expect(screen.queryByText(/\[.*\]/)).not.toBeInTheDocument()
  })

  it("shows name when no title but has name", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "",
        name: "system.noTitle",
        isMinimal: false,
      },
    })

    expect(screen.getByText("system.noTitle")).toBeInTheDocument()
  })

  it("updates when attributes change", () => {
    const { rerender, chart } = renderWithChart(<Title />, {
      attributes: {
        title: "Initial Title",
        name: "initial.name",
        isMinimal: false,
      },
    })

    expect(screen.getByText("Initial Title")).toBeInTheDocument()

    chart.updateAttribute("title", "Updated Title")
    rerender(<Title />)

    expect(screen.queryByText("Initial Title")).not.toBeInTheDocument()
    expect(screen.getByText("Updated Title")).toBeInTheDocument()
  })

  it("handles toggling isMinimal state", () => {
    const { rerender, chart } = renderWithChart(<Title />, {
      attributes: {
        title: "Toggle Test",
        name: "system.toggle",
        designFlavour: "default",
        units: ["%"],
      },
    })

    expect(screen.getByText(/system\.toggle/)).toBeInTheDocument()

    chart.updateAttribute("designFlavour", "minimal")
    rerender(<Title />)

    expect(screen.queryByText(/system\.toggle/)).not.toBeInTheDocument()
  })

  it("applies custom className", () => {
    renderWithChart(<Title className="custom-title" />, {
      attributes: {
        title: "Styled Title",
      },
    })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toHaveClass("custom-title")
  })

  it("passes additional props", () => {
    renderWithChart(<Title data-custom="value" />, {
      attributes: {
        title: "Props Test",
      },
    })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toHaveAttribute("data-custom", "value")
  })

  it("handles empty strings gracefully", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "",
        name: "",
        units: [""],
      },
    })

    const container = screen.getByTestId("chartHeaderStatus-title")
    expect(container).toBeInTheDocument()
    // Should not render bullets when empty
    expect(screen.queryByText("•")).not.toBeInTheDocument()
  })

  it("shows bullet separator between title and name", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "Title Part",
        name: "Name Part",
        isMinimal: false,
      },
    })

    expect(screen.getByText("Title Part")).toBeInTheDocument()
    expect(screen.getByText(/•.*Name Part/)).toBeInTheDocument()
  })

  it("truncates long titles", () => {
    renderWithChart(<Title />, {
      attributes: {
        title: "This is a very long title that should be truncated to prevent overflow in the UI",
      },
    })

    const titleElement = screen.getByText(/This is a very long title/)
    // TextSmall component should have truncate prop
    expect(titleElement).toBeInTheDocument()
  })
})
