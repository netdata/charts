import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import ChartContentWrapper from "./chartContentWrapper"

const zoom = chart => {
  const now = Math.floor(Date.now() / 1000)
  act(() => chart.updateAttributes({ after: now - 600, before: now - 300 }))
}

describe("ChartContentWrapper", () => {
  it.each(["default", "minimal"])(
    "shows the floating navigation toolbox on hover and no zoom chip for %s",
    async flavour => {
      const { chart } = makeTestChart({ attributes: { designFlavour: flavour } })
      const { user, container } = renderWithChart(<ChartContentWrapper />, { chart })

      await user.hover(container.firstChild)
      expect(screen.getByTestId("chartToolbox")).toBeInTheDocument()

      zoom(chart)
      expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
    }
  )

  it("replaces the navigation toolbox with the zoom chip for modern", async () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
    const { user, container } = renderWithChart(<ChartContentWrapper />, { chart })

    await user.hover(container.firstChild)
    expect(screen.queryByTestId("chartToolbox")).not.toBeInTheDocument()

    zoom(chart)
    expect(screen.getByTestId("chartZoomChip")).toBeInTheDocument()
  })

  it("keeps the zoom chip out of sight until the chart is hovered", () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
    renderWithChart(<ChartContentWrapper />, { chart })

    zoom(chart)
    const chip = screen.getByTestId("chartZoomChip")
    expect(getComputedStyle(chip).opacity).toBe("0")
    expect(getComputedStyle(chip).pointerEvents).toBe("none")
  })

  it("has no zoom chip when resetting the range is disabled", () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern", enabledResetRange: false },
    })
    renderWithChart(<ChartContentWrapper />, { chart })

    zoom(chart)
    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
  })
})
