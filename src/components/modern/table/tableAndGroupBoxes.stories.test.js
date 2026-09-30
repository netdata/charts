import React from "react"
import { act, render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import stories, { Light, Dark, DefaultFlavourForComparison } from "./tableAndGroupBoxes.stories"

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
  })

describe("Modern/Table and group boxes stories", () => {
  it("uses the modern story title", () => {
    expect(stories.title).toBe("Modern/Table and group boxes")
  })

  it.each([
    ["light", Light],
    ["dark", Dark],
  ])("renders the %s story with modern table headers and the scale legend", async (_, Story) => {
    render(<Story />)
    await settle()

    expect(screen.getAllByTestId("modernTable-header").length).toBeGreaterThan(0)
    expect(screen.getByTestId("groupBox-legend-scale")).toBeInTheDocument()
    expect(screen.getByTestId("groupBox-legend-threshold")).toBeInTheDocument()
  })

  it("renders the default flavour for comparison without modern cells", async () => {
    render(<DefaultFlavourForComparison />)
    await settle()

    expect(screen.queryByTestId("modernTable-header")).not.toBeInTheDocument()
    expect(screen.queryByTestId("groupBox-legend-scale")).not.toBeInTheDocument()
    expect(screen.getByTestId("groupBox-legend")).toBeInTheDocument()
  })
})
