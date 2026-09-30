import React from "react"
import { screen } from "@testing-library/react"
import { renderWithProviders } from "@jest/testUtilities"
import stories, { PlotOverlays } from "./modernOverlays.stories"

describe("modern plot overlays story", () => {
  it("is filed under the modern stories", () => {
    expect(stories.title).toBe("Modern/Plot overlays")
  })

  it("renders every row in light and dark", () => {
    renderWithProviders(<PlotOverlays />)

    expect(screen.getByText("Thresholds, anomaly strip and annotations")).toBeTruthy()
    expect(screen.getByText("Triggered alert and alert range")).toBeTruthy()
    expect(screen.getAllByText("light")).toHaveLength(5)
    expect(screen.getAllByText("dark")).toHaveLength(5)
  })
})
