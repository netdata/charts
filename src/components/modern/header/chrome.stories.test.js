import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import { Light, Dark } from "./chrome.stories"

describe("Modern chart card chrome story", () => {
  const originalScrollTo = Element.prototype.scrollTo
  beforeAll(() => {
    if (!originalScrollTo) Element.prototype.scrollTo = () => {}
  })
  afterAll(() => {
    if (!originalScrollTo) delete Element.prototype.scrollTo
  })

  it.each([
    ["light", Light],
    ["dark", Dark],
  ])("renders the modern cards and the default comparison in %s", async (_, Story) => {
    renderWithProviders(<Story />)

    await waitFor(() => expect(screen.getAllByTestId("chartScope").length).toBeGreaterThan(0))

    const flavours = screen.getAllByTestId("chartHeader").map(el => el.dataset.flavour)
    expect(flavours.filter(flavour => flavour === "modern")).toHaveLength(4)
    expect(flavours.filter(flavour => !flavour)).toHaveLength(1)

    await waitFor(() =>
      expect(screen.getAllByTestId("chartAttention").map(el => el.dataset.status)).toEqual(
        expect.arrayContaining(["clear", "warning"])
      )
    )
    expect(screen.getByTestId("chartZoomChip")).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByTestId("chartScope-hidden")).toHaveTextContent("2 hidden")
    )
    expect(screen.getByTestId("chartScope-showAll")).toBeInTheDocument()
  })
})
