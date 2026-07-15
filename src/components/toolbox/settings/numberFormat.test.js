import React from "react"
import "@testing-library/jest-dom"
import { screen } from "@testing-library/react"
import { renderWithChart } from "@jest/testUtilities"
import NumberFormat from "./numberFormat"

it("labels scale options with the base unit, not the incoming prefixed unit", async () => {
  const { user } = renderWithChart(<NumberFormat />, {
    attributes: { units: ["KiBy/s"], desiredUnits: ["auto"] },
  })

  await user.click(screen.getByRole("combobox"))

  expect(screen.getByText("Ki By/s")).toBeInTheDocument()
  expect(screen.getByText("Mi By/s")).toBeInTheDocument()
  expect(screen.queryByText("Ki KiBy/s")).not.toBeInTheDocument()
})
