import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import { Line } from "./index"

describe("Line Component", () => {
  it("renders with default props", async () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: true,
        designFlavour: "default",
      },
    })

    expect(screen.getByTestId("chart")).toBeInTheDocument()
    expect(screen.getByTestId("contentWrapper")).toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeader")).toBeInTheDocument()
    expect(screen.getByTestId("chartFooter")).toBeInTheDocument()
    // expect(screen.getByTestId("chartFilters")).toBeInTheDocument() TODO fix me, why am I missing?
  })

  it("hides header when hasHeader is false", () => {
    renderWithChart(<Line hasHeader={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
      },
    })

    expect(screen.queryByTestId("chartHeader")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("hides footer when hasFooter is false", () => {
    renderWithChart(<Line hasFooter={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
      },
    })

    expect(screen.queryByTestId("chartFooter")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("hides filters when hasFilters is false", () => {
    renderWithChart(<Line hasFilters={false} />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
      },
    })

    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("shows details when showingInfo is true", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: true,
        sparkline: false,
        focused: false,
      },
    })

    expect(screen.getByTestId("contentWrapper")).toBeInTheDocument()
    expect(screen.getByTestId("chartDetails")).toBeInTheDocument()
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

    expect(screen.queryByTestId("chartFilters")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  it("renders with chart data and dimensions", () => {
    const { getByTestId } = renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: false,
        dimensionIds: ["cpu.user", "cpu.system"],
      },
      payload: {
        data: [
          [1234567890000, 10, 5],
          [1234567891000, 15, 8],
        ],
      },
    })

    expect(getByTestId("chartContentWrapper")).toBeInTheDocument()
    expect(getByTestId("chart")).toBeInTheDocument()
  })

  it("applies sparkline styling when sparkline is true", () => {
    const { container } = renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: true,
        focused: false,
      },
    })

    const chartElement = container.querySelector("[data-testid='chart']")
    expect(chartElement).toBeInTheDocument()
  })

  it("handles focused state correctly", () => {
    renderWithChart(<Line />, {
      attributes: {
        showingInfo: false,
        sparkline: false,
        focused: true,
      },
    })

    const chart = screen.getByTestId("chart")
    expect(chart).toBeInTheDocument()
    expect(screen.getByTestId("chartContentWrapper")).toBeInTheDocument()
  })

  describe("filter bar placement", () => {
    const countFilters = () => screen.queryAllByTestId("chartFilters").length

    it("renders one fixed filter bar in the default flavour", () => {
      renderWithChart(<Line />, { attributes: { loaded: true, designFlavour: "default" } })
      expect(countFilters()).toBe(1)
    })

    it("leaves the filter bar to the modern header, closed until opened", () => {
      renderWithChart(<Line />, { attributes: { loaded: true, designFlavour: "modern" } })
      expect(countFilters()).toBe(0)
    })

    it("shows a single filter bar when the modern panel is open", () => {
      renderWithChart(<Line />, {
        attributes: { loaded: true, designFlavour: "modern", filtersOpen: true },
      })
      expect(countFilters()).toBe(1)
    })

    it("keeps the fixed filter bar in modern when the header is off", () => {
      renderWithChart(<Line hasHeader={false} />, {
        attributes: { loaded: true, designFlavour: "modern" },
      })
      expect(countFilters()).toBe(1)
    })
  })
})
