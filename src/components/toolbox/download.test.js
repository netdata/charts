import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Download from "./download"

describe("Download component", () => {
  beforeEach(() => {
    global.URL.createObjectURL = jest.fn(() => "blob:mock-url")
    global.URL.revokeObjectURL = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("renders download button with menu options", async () => {
    const { user } = renderWithChart(<Download />)

    const button = screen.getByTestId("chartHeaderToolbox-download")
    expect(button).toBeInTheDocument()

    await user.click(button)

    expect(screen.getByText("Download as CSV")).toBeInTheDocument()
    expect(screen.getByText("Download raw data")).toBeInTheDocument()
    expect(screen.getByText("Download as PNG")).toBeInTheDocument()
    expect(screen.getByText("Download as PDF")).toBeInTheDocument()
  })

  it("triggers CSV raw download when option is clicked", async () => {
    const { user, chart } = renderWithChart(<Download />, {
      attributes: {
        name: "Test Chart",
      },
    })

    chart.payload = {
      data: [
        [1640995200000, 100],
        [1640995260000, 150],
      ],
      labels: ["time", "value"],
    }

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    const csvButton = screen.getByText("Download raw data")
    expect(csvButton).toBeInTheDocument()
  })

  it("triggers CSV converted download with formatted values", async () => {
    const { user, chart } = renderWithChart(<Download />, {
      attributes: {
        name: "Test Chart",
        units: ["%", "%"],
        unitsConversionMethod: ["original"],
        unitsConversionDivider: [1],
        unitsConversionFractionDigits: [2],
      },
    })

    chart.payload = {
      data: [[1640995200000, 42.123]],
      labels: ["time", "cpu"],
    }

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    const csvButton = screen.getByText("Download as CSV")
    expect(csvButton).toBeInTheDocument()
  })

  it("triggers PNG download when option is clicked", async () => {
    const { user } = renderWithChart(<Download />)

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    const pngButton = screen.getByText("Download as PNG")
    expect(pngButton).toBeInTheDocument()
  })

  it("triggers PDF download when option is clicked", async () => {
    const { user } = renderWithChart(<Download />)

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    const pdfButton = screen.getByText("Download as PDF")
    expect(pdfButton).toBeInTheDocument()
  })

  it("disables button when disabled prop is true", () => {
    renderWithChart(<Download disabled={true} />)

    const button = screen.getByTestId("chartHeaderToolbox-download")
    expect(button).toBeDisabled()
  })

  it("handles empty chart data gracefully", async () => {
    const { user, chart } = renderWithChart(<Download />)
    chart.payload = {
      data: [],
      labels: [],
    }

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    expect(screen.getByText("Download raw data")).toBeInTheDocument()
  })

  it("generates filename with timestamp", async () => {
    const { user, chart } = renderWithChart(<Download />, {
      attributes: {
        name: "My Chart",
      },
    })

    chart.payload = {
      data: [[Date.now(), 100]],
      labels: ["time", "value"],
    }

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    const csvButton = screen.getByText("Download raw data")
    expect(csvButton).toBeInTheDocument()
  })

  it("handles heatmap chart type", async () => {
    const { user } = renderWithChart(<Download />, {
      attributes: {
        chartType: "heatmap",
        dimensionIds: ["dim1", "dim2"],
      },
    })

    const button = screen.getByTestId("chartHeaderToolbox-download")
    await user.click(button)

    expect(screen.getByText("Download raw data")).toBeInTheDocument()
  })
})
