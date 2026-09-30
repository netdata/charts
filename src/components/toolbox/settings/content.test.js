import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import SettingsContent from "./content"

const csvRow = "chartSettings-download-download-as-csv"

describe("SettingsContent", () => {
  it("opens on the first tab by default", () => {
    renderWithChart(<SettingsContent onClose={() => {}} />)

    expect(screen.getByTestId("chartSettings")).toBeInTheDocument()
    expect(screen.queryByTestId(csvRow)).not.toBeInTheDocument()
  })

  it("opens on the requested tab", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialTab="download" />)

    expect(screen.getByTestId(csvRow)).toBeInTheDocument()
  })

  it("falls back to the first tab for an unknown tab id", () => {
    renderWithChart(<SettingsContent onClose={() => {}} initialTab="missing" />)

    expect(screen.queryByTestId(csvRow)).not.toBeInTheDocument()
  })
})
