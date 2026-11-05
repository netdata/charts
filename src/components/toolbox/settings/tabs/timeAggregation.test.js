import React from "react"
import "@testing-library/jest-dom"
import { screen } from "@testing-library/react"
import { renderWithChart } from "@jest/testUtilities"
import TimeAggregation from "./timeAggregation"

it("offers the latest value option, matching the filter toolbox", async () => {
  const { user } = renderWithChart(<TimeAggregation />, {
    attributes: { groupingMethod: "average" },
  })

  await user.click(screen.getByRole("combobox"))

  expect(screen.getByText("Latest value")).toBeInTheDocument()
})
