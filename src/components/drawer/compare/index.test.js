import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Compare from "./index"

describe("Compare", () => {
  const periods = [
    {
      id: "selected",
      label: "Selected timeframe",
      after: 1645459425,
      before: 1645459485,
      isBase: true,
      payload: {
        data: [
          [1, 50, 30],
          [2, 60, 40],
        ],
        dimensions: ["cpu", "memory"],
      },
      error: null,
    },
    {
      id: "24h",
      label: "24 hours before",
      after: 1645373025,
      before: 1645373085,
      payload: {
        data: [
          [1, 45, 25],
          [2, 55, 35],
        ],
        dimensions: ["cpu", "memory"],
      },
      error: null,
    },
    {
      id: "7d",
      label: "7 days before",
      after: 1644854625,
      before: 1644854685,
      payload: null,
      error: "Failed to fetch data",
    },
  ]

  const defaultAttributes = {
    comparePeriods: periods,
    compareLoading: false,
    compareError: null,
    drawer: { action: "compare", tab: "window", showAdvancedStats: false },
  }

  const renderCompare = (attributes = {}) =>
    renderWithChart(<Compare />, {
      attributes: {
        ...defaultAttributes,
        ...attributes,
        drawer: {
          ...defaultAttributes.drawer,
          ...attributes.drawer,
        },
      },
    })

  it("renders comparison cards for each period", () => {
    renderCompare()

    expect(screen.getByText("Selected timeframe")).toBeInTheDocument()
    expect(screen.getByText("24 hours before")).toBeInTheDocument()
    expect(screen.getByText("7 days before")).toBeInTheDocument()
  })

  it("displays period labels for each period", () => {
    renderCompare()

    expect(screen.getByText("Selected timeframe")).toBeInTheDocument()
    expect(screen.getByText("24 hours before")).toBeInTheDocument()
    expect(screen.getByText("7 days before")).toBeInTheDocument()
  })

  it("shows stats for loaded periods", () => {
    renderCompare()

    const minElements = screen.getAllByText("Min")
    const avgElements = screen.getAllByText("Avg")
    const maxElements = screen.getAllByText("Max")

    expect(minElements.length).toBeGreaterThan(0)
    expect(avgElements.length).toBeGreaterThan(0)
    expect(maxElements.length).toBeGreaterThan(0)
  })

  it("shows error state for failed periods", () => {
    renderCompare()

    expect(screen.getByText("Error loading data")).toBeInTheDocument()
  })

  it("shows error message when hook returns error", () => {
    const error = "Network connection failed"
    renderCompare({ compareError: error })

    expect(screen.getByText(`Error: ${error}`)).toBeInTheDocument()
  })

  it("shows custom period selector when periods are loaded", () => {
    renderCompare()

    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.getByText("Select a timeframe")).toBeInTheDocument()
  })

  it("uses the design-system scale for its grid, card, change, and edit icon", () => {
    renderCompare()

    expect(screen.getByTestId("comparison-grid")).toHaveStyle(
      "display: grid; gap: 12px; grid-template-columns: repeat(auto-fill,minmax(260px,1fr))"
    )
    expect(screen.getByTestId("custom-period-card")).toHaveStyle("min-height: 144px")
    expect(screen.getByText("12.5% ↓").parentElement).toHaveStyle("gap: 4px")

    const editIcon = screen.getAllByTestId("period-edit")[0].querySelector("svg")
    expect(editIcon).toHaveStyle({ height: "12px", width: "12px" })
  })

  it("shows custom period selector even when no periods loaded", () => {
    renderCompare({ comparePeriods: [] })

    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.getByText("Select a timeframe")).toBeInTheDocument()
  })

  it("shows min, avg, max values for periods with data", () => {
    renderCompare()

    const minElements = screen.getAllByText("Min")
    const avgElements = screen.getAllByText("Avg")
    const maxElements = screen.getAllByText("Max")

    expect(minElements).toHaveLength(2)
    expect(avgElements).toHaveLength(2)
    expect(maxElements).toHaveLength(2)
  })

  it("handles periods without payload gracefully", () => {
    const periodsWithoutPayload = [
      {
        id: "selected",
        label: "Selected timeframe",
        after: 1000,
        before: 2000,
        payload: null,
        error: null,
      },
    ]

    renderCompare({ comparePeriods: periodsWithoutPayload })

    expect(screen.getByText("No data available for the selected time range")).toBeInTheDocument()
  })

  describe("Custom Period Form", () => {
    it("shows custom period form when button is clicked", () => {
      renderCompare()

      fireEvent.click(screen.getByText("Select a timeframe"))

      expect(screen.getByText("Add Custom Period")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("e.g. 3 days ago")).toBeInTheDocument()
      expect(screen.getByText("Days")).toBeInTheDocument()
      expect(screen.getByText("Hours")).toBeInTheDocument()
    })

    it("hides custom period selector when form is shown", () => {
      renderCompare()

      fireEvent.click(screen.getByText("Select a timeframe"))

      expect(screen.queryByText("Custom")).not.toBeInTheDocument()
      expect(screen.queryByText("Select a timeframe")).not.toBeInTheDocument()
    })

    it("cancels form and shows selector again", () => {
      renderCompare()

      fireEvent.click(screen.getByText("Select a timeframe"))
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.queryByText("Add Custom Period")).not.toBeInTheDocument()
      expect(screen.getByText("Custom")).toBeInTheDocument()
      expect(screen.getByText("Select a timeframe")).toBeInTheDocument()
    })

    it("adds custom period and updates chart attribute", () => {
      const { chart } = renderCompare()

      fireEvent.click(screen.getByText("Select a timeframe"))

      const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
      const numberInputs = screen.getAllByRole("spinbutton")

      fireEvent.change(labelInput, { target: { value: "3 days ago" } })
      fireEvent.change(numberInputs[0], { target: { value: "3" } })
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      expect(chart.getAttribute("customPeriods")).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^custom_\d+$/),
            label: "3 days ago",
            offsetSeconds: 259200,
          }),
        ])
      )
      expect(screen.queryByText("Add Custom Period")).not.toBeInTheDocument()
    })

    it("appends to existing custom periods", () => {
      const existingPeriods = [{ id: "existing", label: "Existing", offsetSeconds: 3600 }]
      const { chart } = renderCompare({ customPeriods: existingPeriods })

      fireEvent.click(screen.getByText("Select a timeframe"))

      const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
      const numberInputs = screen.getAllByRole("spinbutton")

      fireEvent.change(labelInput, { target: { value: "New period" } })
      fireEvent.change(numberInputs[1], { target: { value: "6" } })
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      expect(chart.getAttribute("customPeriods")).toEqual([
        ...existingPeriods,
        expect.objectContaining({
          id: expect.stringMatching(/^custom_\d+$/),
          label: "New period",
          offsetSeconds: 21600,
        }),
      ])
    })
  })

  describe("ComparisonCard", () => {
    it("shows stats for successful periods", () => {
      renderCompare()

      expect(screen.getAllByText("Min").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Avg").length).toBeGreaterThan(0)
      expect(screen.getAllByText("Max").length).toBeGreaterThan(0)
    })
  })

  describe("Volume visibility", () => {
    const periodsWithVolume = [
      {
        id: "selected",
        label: "Selected timeframe",
        after: 1645459425,
        before: 1645459485,
        isBase: true,
        payload: { data: [[1, 50, 30]], dimensions: ["a", "b"] },
        error: null,
      },
    ]

    it("shows volume for rate units ending with /s", () => {
      renderCompare({
        comparePeriods: periodsWithVolume,
        units: ["kilobits/s"],
        drawer: { showAdvancedStats: true },
      })

      expect(screen.getByText("Volume")).toBeInTheDocument()
    })

    it("hides volume for non-rate units", () => {
      renderCompare({
        comparePeriods: periodsWithVolume,
        units: ["%"],
        drawer: { showAdvancedStats: true },
      })

      expect(screen.queryByText("Volume")).not.toBeInTheDocument()
    })

    it("hides volume when units is empty", () => {
      renderCompare({
        comparePeriods: periodsWithVolume,
        units: [""],
        drawer: { showAdvancedStats: true },
      })

      expect(screen.queryByText("Volume")).not.toBeInTheDocument()
    })
  })
})
