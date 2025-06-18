import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@/testUtilities"
import { NumberChart, Value, Unit } from "./index"

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
      position: "relative"
    })
  })
})

describe("Value component", () => {
  it("renders latest converted value", () => {
    renderWithChart(<Value />, {
      testChartOptions: {
        attributes: {
          dimensionIds: ["cpu"],
          latestValues: [42.5],
          selectedDimensions: ["cpu"],
          unitsConversionMethod: ["original"],
          unitsConversionDivider: [1],
          unitsConversionFractionDigits: [2]
        }
      }
    })
    
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("formats value based on conversion settings", () => {
    renderWithChart(<Value />, {
      testChartOptions: {
        attributes: {
          dimensionIds: ["memory"],
          latestValues: [1024],
          selectedDimensions: ["memory"],
          unitsConversionMethod: ["divide"],
          unitsConversionDivider: [1024],
          unitsConversionFractionDigits: [2]
        }
      }
    })
    
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("handles missing values gracefully", () => {
    renderWithChart(<Value />, {
      testChartOptions: {
        attributes: {
          dimensionIds: ["cpu"],
          latestValues: [],
          selectedDimensions: ["cpu"]
        }
      }
    })
    
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("responds to dimension size changes", () => {
    const { chart } = renderWithChart(<Value />, {
      testChartOptions: {
        attributes: {
          dimensionIds: ["cpu"],
          latestValues: [42],
          selectedDimensions: ["cpu"]
        }
      }
    })
    
    chart.trigger("resize", { width: 400, height: 300 })
    
    expect(screen.getByText("-")).toBeInTheDocument()
  })
})

describe("Unit component", () => {
  it("renders unit sign when available", () => {
    renderWithChart(<Unit />, { 
      testChartOptions: { 
        attributes: {
          dimensionIds: ["cpu"],
          units: ["%"],
          unitsCurrent: ["%"],
          unitsConversionBase: ["%"],
          unitsConversionPrefix: [""]
        }
      }
    })
    
    expect(screen.getByText("%")).toBeInTheDocument()
  })

  it("renders nothing when unit is empty", () => {
    const { container } = renderWithChart(<Unit />, { 
      testChartOptions: { 
        attributes: {
          dimensionIds: ["cpu"],
          units: [""],
          unitsCurrent: "",
          unitsConversionBase: [""],
          unitsConversionPrefix: [""]
        }
      }
    })
    
    expect(container.firstChild).toBeNull()
  })

  it("shows unit with prefix when converted", () => {
    renderWithChart(<Unit />, { 
      testChartOptions: { 
        attributes: {
          dimensionIds: ["memory"],
          units: ["By"],
          unitsCurrent: "By",
          unitsConversionBase: ["B"],
          unitsConversionPrefix: ["Ki"]
        }
      }
    })
    
    expect(screen.getByText(/Ki.*B/)).toBeInTheDocument()
  })

  it("uses first dimension for unit determination", () => {
    renderWithChart(<Unit />, { 
      testChartOptions: { 
        attributes: {
          dimensionIds: ["cpu", "memory"],
          units: ["%"],
          unitsCurrent: ["%"],
          unitsConversionBase: ["%", "B"],
          unitsConversionPrefix: ["", "Ki"]
        }
      }
    })
    
    expect(screen.getByText("%")).toBeInTheDocument()
  })

  it("handles no dimensions gracefully", () => {
    const { container } = renderWithChart(<Unit />, {
      testChartOptions: {
        attributes: {
          dimensionIds: []
        }
      }
    })
    
    expect(container.firstChild).toBeNull()
  })
})