import React from "react"
import "@testing-library/jest-dom"
import { screen } from "@testing-library/react"
import { renderWithChart } from "@jest/testUtilities"
import NumberFormat from "./numberFormat"

describe("temperature units in chart settings", () => {
  it("uses a single control, not a separate preference select", () => {
    renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"], temperature: "fahrenheit" },
    })

    expect(screen.getAllByRole("combobox")).toHaveLength(1)
  })

  it("shows what the inherited preference resolves to", () => {
    renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"], temperature: "fahrenheit" },
    })

    expect(screen.getByText("Follow preference (°F)")).toBeInTheDocument()
  })

  it("resolves to the source unit when the preference does not convert", () => {
    renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"] },
    })

    expect(screen.getByText("Follow preference (°C)")).toBeInTheDocument()
  })

  it("offers both temperature units by symbol", async () => {
    const { user } = renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"] },
    })

    await user.click(screen.getByRole("combobox"))

    expect(screen.getByText("°C")).toBeInTheDocument()
    expect(screen.getByText("°F")).toBeInTheDocument()
    expect(screen.queryByText("No conversion")).not.toBeInTheDocument()
  })

  it("pins this chart to Fahrenheit", async () => {
    const { user, chart } = renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"] },
    })

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByText("°F"))

    expect(chart.getAttribute("desiredUnits")).toEqual(["[degF]"])
  })

  it("pins this chart to its source unit", async () => {
    const { user, chart } = renderWithChart(<NumberFormat />, {
      attributes: { units: ["Cel"], desiredUnits: ["auto"], temperature: "fahrenheit" },
    })

    await user.click(screen.getByRole("combobox"))
    await user.click(screen.getByText("°C"))

    expect(chart.getAttribute("desiredUnits")).toEqual(["original"])
  })

  it("keeps the generic labels for non-temperature units", async () => {
    const { user } = renderWithChart(<NumberFormat />, {
      attributes: { units: ["By"], desiredUnits: ["auto"] },
    })

    await user.click(screen.getByRole("combobox"))

    expect(screen.getAllByText("Auto scale").length).toBeGreaterThan(0)
    expect(screen.getByText("No conversion")).toBeInTheDocument()
    expect(screen.queryByText(/Follow preference/)).not.toBeInTheDocument()
  })
})
