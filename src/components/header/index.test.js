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
