import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Header from "./index"
import { actions } from "../constants"

describe("Drawer Header", () => {
  it("renders expanded-view actions with an icon and visible label", () => {
    renderWithChart(<Header />)
    const labels = ["Compare", "Values", "Drill Down", "Correlate"]

    labels.forEach(label => {
      const button = screen.getByText(label).closest("button")

      expect(button).toBeInTheDocument()
      expect(button.querySelector(".button-icon")).toBeInTheDocument()
    })
  })

  it("updates the expanded-view action from a labeled button", async () => {
    const { chart, user } = renderWithChart(<Header />)

    await user.click(screen.getByText("Correlate"))

    expect(chart.getAttribute("drawer.action")).toBe(actions.correlate)
  })

  it("uses the public metrics icon and toggles advanced statistics", async () => {
    const { chart, user } = renderWithChart(<Header />)
    const button = screen.getByTestId("drawer-header-advanced-stats")

    expect(button.querySelector(".button-icon")).toHaveStyle({
      height: "16px",
      width: "16px",
    })

    await user.click(button)

    expect(chart.getAttribute("drawer.showAdvancedStats")).toBe(true)
  })
})
