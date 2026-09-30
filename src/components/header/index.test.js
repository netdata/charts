import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Header from "./index"

describe("Header component", () => {
  it("renders the title by default", () => {
    renderWithChart(<Header />, {
      attributes: { title: "CPU Usage" },
    })

    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
  })

  it("hides the title when hideTitle is true", () => {
    renderWithChart(<Header />, {
      attributes: { title: "CPU Usage", hideTitle: true },
    })

    expect(screen.queryByText("CPU Usage")).not.toBeInTheDocument()
  })
})

describe("Header flavours", () => {
  const ConsumerAction = ({ disabled }) => (
    <button type="button" disabled={disabled}>
      Consumer action
    </button>
  )

  it.each(["default", "minimal"])("keeps the %s header free of modern elements", flavour => {
    renderWithChart(<Header hasFilters />, {
      attributes: {
        title: "CPU Usage",
        designFlavour: flavour,
        focused: true,
        toolboxElements: [ConsumerAction],
      },
    })

    expect(screen.getByTestId("chartHeader")).not.toHaveAttribute("data-flavour")
    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox")).toBeInTheDocument()
    expect(screen.getByText("Consumer action")).toBeEnabled()
    expect(screen.getByText("CPU Usage")).toBeInTheDocument()
    expect(screen.queryByTestId("chartScope")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartScope-loading")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-more")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-filters")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartAttention")).not.toBeInTheDocument()
  })

  it("renders the modern header only for the modern flavour", () => {
    renderWithChart(<Header hasFilters />, {
      attributes: { title: "CPU Usage", designFlavour: "modern" },
    })

    expect(screen.getByTestId("chartHeader")).toHaveAttribute("data-flavour", "modern")
    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox-more")).toBeInTheDocument()
  })
})
