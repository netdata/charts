import React from "react"
import { fireEvent, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme } from "@netdata/netdata-ui"
import { renderWithChart, inkOf, bubblesAround } from "@jest/testUtilities"
import Label from "./label"

const { tooltip, tooltipText } = DefaultTheme.colors

describe("filterToolbox Label tooltip", () => {
  const hover = async () => {
    renderWithChart(
      <Label
        label="Nodes"
        title="Nodes"
        tooltipProps={{ heading: "Tooltip heading", body: "Tooltip body" }}
      />
    )

    fireEvent.mouseEnter(screen.getByText("Nodes"))

    return {
      heading: await screen.findByText("Tooltip heading"),
      body: await screen.findByText("Tooltip body"),
    }
  }

  it("renders heading and body in the tooltip text colour", async () => {
    const { heading, body } = await hover()

    expect(inkOf(heading)).toBe(tooltipText.toUpperCase())
    expect(inkOf(body)).toBe(tooltipText.toUpperCase())
  })

  it("draws a single tooltip bubble owned by the kit", async () => {
    const { heading, body } = await hover()

    const bubbles = bubblesAround(heading, tooltip)
    expect(bubbles).toHaveLength(1)
    expect(bubbles[0]).toContainElement(body)
    expect(getComputedStyle(bubbles[0]).borderRadius).toBe("6px")
  })
})
