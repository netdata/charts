import React from "react"
import { act, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Light, Dark } from "./gauge.stories"

describe("Modern/Gauge stories", () => {
  it.each([
    ["light", Light],
    ["dark", Dark],
  ])("renders every variant as an SVG gauge in %s", async (name, Story) => {
    render(<Story />)

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })

    expect(screen.getAllByTestId("modernGauge")).toHaveLength(6)
    expect(document.querySelector("canvas")).toBeNull()
    expect(screen.getByText("Warning")).toBeInTheDocument()
    expect(screen.getAllByText("Critical")).toHaveLength(2)
    expect(
      screen.getAllByTestId("modernGauge-attention").map(node => node.getAttribute("data-severity"))
    ).toEqual(["ok", "warning", "critical", "critical"])
  })
})
