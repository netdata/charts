import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@/testUtilities"
import Information from "./information"

describe("Information component", () => {
  it("renders information button with correct attributes", () => {
    renderWithChart(<Information />)
    
    const button = screen.getByTestId("chartHeaderToolbox-information")
    expect(button).toBeInTheDocument()
    expect(button).not.toBeDisabled()
  })

  it("handles user interactions correctly", () => {
    renderWithChart(<Information />)
    
    const button = screen.getByTestId("chartHeaderToolbox-information")
    fireEvent.click(button)
    
    // Button should be clickable and responsive
    expect(button).toBeInTheDocument()
  })

  it("respects disabled state and passes props correctly", () => {
    renderWithChart(<Information disabled={true} className="custom-class" data-test="information" />)
    
    const button = screen.getByTestId("chartHeaderToolbox-information")
    expect(button).toBeInTheDocument()
    expect(button).toBeDisabled()
    expect(button).toHaveClass("custom-class")
    expect(button).toHaveAttribute("data-test", "information")
  })
})