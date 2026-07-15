import React from "react"
import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { renderWithProviders } from "@jest/testUtilities"
import { GraphOnlyMinimalMetadata } from "./highCardinalityChart.stories"

describe("high-cardinality chart story", () => {
  it("renders generated data and skips unchanged cross-tick render requests", async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <GraphOnlyMinimalMetadata dimensionCount={100} points={2} dimensionsSort="valueDesc" />
    )

    const button = screen.getByRole("button", { name: "Request 20 unchanged renders" })
    await waitFor(() => expect(button.disabled).toBe(false))

    await user.click(button)

    expect(await screen.findByText("Requested 20; actual redraws 0.")).toBeTruthy()
  })
})
