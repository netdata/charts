import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import Label from "./label"

describe("groupBoxes popover Label", () => {
  it("wraps long label keys and values instead of overflowing", () => {
    renderWithProviders(
      <Label label="wlsx_switch_license_serial_number" value={["ethernetCsmacd"]} />
    )

    expect(screen.getByText("wlsx_switch_license_serial_number")).toHaveStyle(
      "word-break: break-word"
    )
    expect(screen.getByText("ethernetCsmacd")).toHaveStyle("word-break: break-word")
  })

  it("renders a dash for missing values", () => {
    renderWithProviders(<Label label="vendor" />)

    expect(screen.getByText("-")).toBeInTheDocument()
  })
})
