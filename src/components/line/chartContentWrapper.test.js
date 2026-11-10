import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import { TileContext } from "@/components/modern/tile/context"
import ChartContentWrapper, { Container } from "./chartContentWrapper"

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

  const InTile = () => (
    <TileContext.Provider value>
      <ChartContentWrapper />
    </TileContext.Provider>
  )

  it("replaces the navigation toolbox with the zoom chip in a modern tile", async () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
    const { user, container } = renderWithChart(<InTile />, { chart })

    await user.hover(container.firstChild)
    expect(screen.queryByTestId("chartToolbox")).not.toBeInTheDocument()

    zoom(chart)
    expect(screen.getByTestId("chartZoomChip")).toBeInTheDocument()
  })

  it("keeps the zoom chip out of sight until the tile is hovered", () => {
    const { chart } = makeTestChart({ attributes: { designFlavour: "modern" } })
    renderWithChart(<InTile />, { chart })

    zoom(chart)
    const chip = screen.getByTestId("chartZoomChip")
    expect(getComputedStyle(chip).opacity).toBe("0")
    expect(getComputedStyle(chip).pointerEvents).toBe("none")
  })

  it("has no zoom chip when resetting the range is disabled", () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern", enabledResetRange: false },
    })
    renderWithChart(<InTile />, { chart })

    zoom(chart)
    expect(screen.queryByTestId("chartZoomChip")).not.toBeInTheDocument()
  })

  describe("heatmap cell click cursor", () => {
    const cursorOf = attributes => {
      const { chart } = makeTestChart({
        attributes: {
          chartType: "heatmap",
          heatmapCellClick: true,
          enabledNavigation: true,
          ...attributes,
        },
      })
      const { container, unmount } = renderWithChart(<Container />, { chart })
      const { cursor } = window.getComputedStyle(
        container.querySelector('[data-testid="chartContentWrapper"]')
      )
      unmount()
      return cursor
    }

    it("shows a pointer where a cell click fires", () => {
      expect(cursorOf({ navigation: "pan" })).toBe("pointer")
    })

    it("keeps the navigation cursor where a cell click cannot fire", () => {
      expect(cursorOf({ navigation: "select" })).toBe("col-resize")
      expect(cursorOf({ navigation: "pan", enabledNavigation: false })).not.toBe("pointer")
      expect(cursorOf({ navigation: "pan", heatmapCellClick: false })).not.toBe("pointer")
    })
  })
})
