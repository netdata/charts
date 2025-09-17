import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Compare from "./index"
import { useComparisonData } from "./useData"

jest.mock("./useComparisonData")

describe("Compare", () => {
  const mockPeriods = [
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
      stats: {
        min: 30,
        avg: 45,
        max: 60,
        points: 2,
        dimensions: 2,
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
      stats: {
        min: 25,
        avg: 40,
        max: 55,
        points: 2,
        dimensions: 2,
      },
      changes: {
        min: { value: 16.7, direction: "down", formatted: "16.7%" },
        avg: { value: 11.1, direction: "down", formatted: "11.1%" },
        max: { value: 8.3, direction: "down", formatted: "8.3%" },
        points: { value: 0, direction: "up", formatted: "0%" },
        dimensions: { value: 0, direction: "up", formatted: "0%" },
      },
      error: null,
    },
    {
      id: "7d",
      label: "7 days before",
      after: 1644854625,
      before: 1644854685,
      payload: null,
      stats: null,
      error: "Failed to fetch data",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    useComparisonData.mockReturnValue({
      periods: mockPeriods,
      loading: false,
      error: null,
    })
  })

  it("renders comparison cards for each period", () => {
    renderWithChart(<Compare />)

    expect(screen.getByText("Selected timeframe")).toBeInTheDocument()
    expect(screen.getByText("24 hours before")).toBeInTheDocument()
    expect(screen.getByText("7 days before")).toBeInTheDocument()
  })

  it("displays formatted date ranges for each period", () => {
    renderWithChart(<Compare />)

    const dateRanges = screen.getAllByText(/→/)
    expect(dateRanges).toHaveLength(3)
  })

  it("shows data points and dimensions for loaded periods", () => {
    renderWithChart(<Compare />)

    const dataPointsElements = screen.getAllByText("Data Points")
    const dimensionsElements = screen.getAllByText("Dimensions")

    expect(dataPointsElements).toHaveLength(2)
    expect(dimensionsElements).toHaveLength(2)
    expect(screen.getAllByText("2")).toHaveLength(4)
  })

  it("shows error state for failed periods", () => {
    renderWithChart(<Compare />)

    expect(screen.getByText("Error loading data")).toBeInTheDocument()
  })

  it("shows loading state when comparison data is loading", () => {
    useComparisonData.mockReturnValue({
      periods: [],
      loading: true,
      error: null,
    })

    renderWithChart(<Compare />)

    expect(screen.getByText("Loading comparison data...")).toBeInTheDocument()
  })

  it("shows error message when hook returns error", () => {
    const error = "Network connection failed"
    useComparisonData.mockReturnValue({
      periods: [],
      loading: false,
      error,
    })

    renderWithChart(<Compare />)

    expect(screen.getByText(`Error: ${error}`)).toBeInTheDocument()
  })

  it("shows custom period selector when periods are loaded", () => {
    renderWithChart(<Compare />)

    expect(screen.getByText("Custom")).toBeInTheDocument()
    expect(screen.getByText("Select a timeframe")).toBeInTheDocument()
  })

  it("does not show custom period selector when no periods loaded", () => {
    useComparisonData.mockReturnValue({
      periods: [],
      loading: false,
      error: null,
    })

    renderWithChart(<Compare />)

    expect(screen.queryByText("Custom")).not.toBeInTheDocument()
    expect(screen.queryByText("Select a timeframe")).not.toBeInTheDocument()
  })

  it("shows min, avg, max values for periods with data", () => {
    renderWithChart(<Compare />)

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

    useComparisonData.mockReturnValue({
      periods: periodsWithoutPayload,
      loading: false,
      error: null,
    })

    renderWithChart(<Compare />)

    expect(screen.getByText("Loading...")).toBeInTheDocument()
  })

  describe("Custom Period Form", () => {
    it("shows custom period form when button is clicked", () => {
      renderWithChart(<Compare />)

      fireEvent.click(screen.getByText("Select a timeframe"))

      expect(screen.getByText("Add Custom Period")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("e.g. 3 days ago")).toBeInTheDocument()
      expect(screen.getByText("Days")).toBeInTheDocument()
      expect(screen.getByText("Hours")).toBeInTheDocument()
    })

    it("hides custom period selector when form is shown", () => {
      renderWithChart(<Compare />)

      fireEvent.click(screen.getByText("Select a timeframe"))

      expect(screen.queryByText("Custom")).not.toBeInTheDocument()
      expect(screen.queryByText("Select a timeframe")).not.toBeInTheDocument()
    })

    it("cancels form and shows selector again", () => {
      renderWithChart(<Compare />)

      fireEvent.click(screen.getByText("Select a timeframe"))
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.queryByText("Add Custom Period")).not.toBeInTheDocument()
      expect(screen.getByText("Custom")).toBeInTheDocument()
      expect(screen.getByText("Select a timeframe")).toBeInTheDocument()
    })

    it("adds custom period and updates chart attribute", () => {
      const { chart } = renderWithChart(<Compare />)
      const updateAttributeSpy = jest.spyOn(chart, "updateAttribute")

      fireEvent.click(screen.getByText("Select a timeframe"))

      const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
      const numberInputs = screen.getAllByRole("spinbutton")

      fireEvent.change(labelInput, { target: { value: "3 days ago" } })
      fireEvent.change(numberInputs[0], { target: { value: "3" } })
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      expect(updateAttributeSpy).toHaveBeenCalledWith(
        "customPeriods",
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.stringMatching(/^custom_\d+$/),
            label: "3 days ago",
            offsetSeconds: 259200,
          }),
        ])
      )
      expect(screen.queryByText("Add Custom Period")).not.toBeInTheDocument()

      updateAttributeSpy.mockRestore()
    })

    it("appends to existing custom periods", () => {
      const existingPeriods = [{ id: "existing", label: "Existing", offsetSeconds: 3600 }]
      const { chart } = renderWithChart(<Compare />)

      chart.updateAttribute("customPeriods", existingPeriods)
      const updateAttributeSpy = jest.spyOn(chart, "updateAttribute")

      fireEvent.click(screen.getByText("Select a timeframe"))

      const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
      const numberInputs = screen.getAllByRole("spinbutton")

      fireEvent.change(labelInput, { target: { value: "New period" } })
      fireEvent.change(numberInputs[1], { target: { value: "6" } })
      fireEvent.click(screen.getByRole("button", { name: "Add" }))

      expect(updateAttributeSpy).toHaveBeenCalledWith("customPeriods", [
        ...existingPeriods,
        expect.objectContaining({
          id: expect.stringMatching(/^custom_\d+$/),
          label: "New period",
          offsetSeconds: 21600,
        }),
      ])

      updateAttributeSpy.mockRestore()
    })
  })

  describe("ComparisonCard", () => {
    it("shows correct data metrics for successful periods", () => {
      renderWithChart(<Compare />)

      expect(screen.getAllByText("2")).toHaveLength(4)
      expect(screen.getAllByText("Min")).toHaveLength(2)
      expect(screen.getAllByText("Avg")).toHaveLength(2)
      expect(screen.getAllByText("Max")).toHaveLength(2)
    })

    it("formats date ranges correctly", () => {
      renderWithChart(<Compare />)

      const dateRanges = screen.getAllByText(/→/)
      expect(dateRanges).toHaveLength(3)
    })
  })
})
