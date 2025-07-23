import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import Fullscreen from "./fullscreen"

describe("Fullscreen component", () => {
  it("renders fullscreen button when not in fullscreen mode", () => {
    renderWithChart(<Fullscreen />, {
      attributes: {
        fullscreen: false,
      },
    })

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute("data-testid", "chartHeaderToolbox-fullscreen")
  })

  it("renders minimize button when in fullscreen mode", () => {
    renderWithChart(<Fullscreen />, {
      attributes: {
        fullscreen: true,
      },
    })

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
  })

  it("toggles fullscreen when button is clicked", () => {
    const { chart } = makeTestChart({
      attributes: {
        fullscreen: false,
      },
    })

    const spy = jest.spyOn(chart, "toggleFullscreen")

    renderWithChart(<Fullscreen />, { chart })

    const button = screen.getByRole("button")
    fireEvent.click(button)

    expect(spy).toHaveBeenCalled()
  })

  it("renders with disabled state", () => {
    renderWithChart(<Fullscreen disabled={true} />)

    const button = screen.getByRole("button")
    expect(button).toBeDisabled()
  })

  it("renders with enabled state by default", () => {
    renderWithChart(<Fullscreen />)

    const button = screen.getByRole("button")
    expect(button).not.toBeDisabled()
  })

  it("passes additional props to Button component", () => {
    renderWithChart(<Fullscreen className="custom-class" data-test="fullscreen" />)

    const button = screen.getByRole("button")
    expect(button).toHaveClass("custom-class")
    expect(button).toHaveAttribute("data-test", "fullscreen")
  })

  it("updates when fullscreen state changes", () => {
    const { chart, rerender } = renderWithChart(<Fullscreen />)

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()

    chart.updateAttribute("fullscreen", true)
    rerender(<Fullscreen />)

    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("handles rapid toggling", () => {
    const { chart } = makeTestChart({
      attributes: {
        fullscreen: false,
      },
    })

    const spy = jest.spyOn(chart, "toggleFullscreen")

    renderWithChart(<Fullscreen />, { chart })

    const button = screen.getByRole("button")

    fireEvent.click(button)
    fireEvent.click(button)
    fireEvent.click(button)

    expect(spy).toHaveBeenCalledTimes(3)
  })

  it("has correct accessibility attributes", () => {
    renderWithChart(<Fullscreen />, {
      attributes: {
        fullscreen: false,
      },
    })

    const button = screen.getByRole("button")
    expect(button).toHaveAttribute("data-testid", "chartHeaderToolbox-fullscreen")
  })
})
