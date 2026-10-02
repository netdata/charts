import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { record, reset, setEnabled } from "@/sdk/plugins/perfMonitor/registry"
import PerfOverlay from "./"

describe("PerfOverlay", () => {
  beforeEach(() => {
    reset()
    setEnabled(true)
  })

  afterEach(() => {
    reset()
    setEnabled(false)
  })

  it("shows seeded registry stats", () => {
    record("c1", "uplot", 12)
    record("c1", "uplot", 8)

    render(<PerfOverlay />)

    expect(screen.getByTestId("perfOverlay")).toBeInTheDocument()
    expect(screen.getByText(/renders: 2/)).toBeInTheDocument()
    expect(screen.getByTestId("perf-renderer-uplot")).toHaveTextContent("uplot: 2")
  })

  it("shows heap n/a when unsupported", () => {
    render(<PerfOverlay />)

    expect(screen.getByText(/heap: n\/a/)).toBeInTheDocument()
  })
})
