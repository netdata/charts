import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import { Light, Dark } from "./tiles.stories"

describe("Modern tiles story", () => {
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
  ])("renders every modern tile in %s", async (_, Story) => {
    renderWithProviders(<Story compare={false} />)

    await waitFor(() => expect(screen.getAllByTestId("modernTile")).toHaveLength(9))
    await waitFor(() => expect(screen.getAllByTestId("modernTileReadout")).toHaveLength(3))
    expect(screen.getAllByTestId("modernTile-drag")).toHaveLength(1)
    await waitFor(() => expect(screen.getAllByTestId("modernTileAlert")).toHaveLength(1))
  })
})
