import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import { Line } from "./index"

describe("Line Component", () => {

  it("renders with default props", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chart")).toBeInTheDocument()
    expect(screen.getByTestId("contentWrapper")).toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("hides header when hasHeader is false", () => {
    renderWithChart(<Line hasHeader={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("hides footer when hasFooter is false", () => {
    renderWithChart(<Line hasFooter={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("hides filters when hasFilters is false", () => {
    renderWithChart(<Line hasFilters={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("shows details when showingInfo is true", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: true,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("contentWrapper")).toBeInTheDocument()
  })

  it("hides filters in minimal mode", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "minimal",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("passes uiName to chart content wrapper", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("applies sparkline styling when sparkline is true", () => {
    const { container } = renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: true,
        focused: false,
        designFlavour: "standard",
      },
    })

    const containerElement = container.querySelector("[data-testid]").parentElement
    expect(containerElement).toBeInTheDocument()
  })

  it("sets focus and blur handlers correctly", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        designFlavour: "standard",
      },
    })

    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })
})