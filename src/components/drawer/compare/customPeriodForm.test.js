import React from "react"
import { screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import CustomPeriodForm from "./customPeriodForm"

describe("CustomPeriodForm", () => {
  const mockOnAdd = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders form with all inputs", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    expect(screen.getByText("Add Custom Period")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("e.g. 3 days ago")).toBeInTheDocument()
    expect(screen.getByText("Days")).toBeInTheDocument()
    expect(screen.getByText("Hours")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("updates label input value", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    fireEvent.change(labelInput, { target: { value: "Custom period" } })

    expect(labelInput.value).toBe("Custom period")
  })

  it("updates days input value", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const daysInputs = screen.getAllByRole("spinbutton")
    const daysInput = daysInputs[0] // First number input should be days
    fireEvent.change(daysInput, { target: { value: "3" } })

    expect(daysInput.value).toBe("3")
  })

  it("updates hours input value", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const hoursInputs = screen.getAllByRole("spinbutton")
    const hoursInput = hoursInputs[1] // Second number input should be hours
    fireEvent.change(hoursInput, { target: { value: "12" } })

    expect(hoursInput.value).toBe("12")
  })

  it("calls onCancel when cancel button is clicked", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it("uses auto-generated label when label is empty but has valid offset", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const daysInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(daysInputs[0], { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "3 days ago",
      offsetSeconds: 259200,
    })
  })

  it("does not call onAdd when offset is zero", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    fireEvent.change(labelInput, { target: { value: "Test period" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it("calls onAdd with correct values for days only", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const daysInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "3 days ago" } })
    fireEvent.change(daysInputs[0], { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "3 days ago",
      offsetSeconds: 259200, // 3 days * 24 * 60 * 60
    })
  })

  it("calls onAdd with correct values for hours only", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const hoursInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "12 hours ago" } })
    fireEvent.change(hoursInputs[1], { target: { value: "12" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "12 hours ago",
      offsetSeconds: 43200, // 12 * 60 * 60
    })
  })

  it("calls onAdd with correct values for days and hours combined", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const numberInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "1 day 12 hours ago" } })
    fireEvent.change(numberInputs[0], { target: { value: "1" } })
    fireEvent.change(numberInputs[1], { target: { value: "12" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "1 day 12 hours ago",
      offsetSeconds: 129600, // (1 * 24 * 60 * 60) + (12 * 60 * 60)
    })
  })

  it("trims whitespace from label", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const daysInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "  Test period  " } })
    fireEvent.change(daysInputs[0], { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "Test period",
      offsetSeconds: 86400,
    })
  })

  it("handles non-numeric input gracefully", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const numberInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "Test period" } })
    fireEvent.change(numberInputs[0], { target: { value: "abc" } })
    fireEvent.change(numberInputs[1], { target: { value: "12" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "Test period",
      offsetSeconds: 43200, // Only hours counted: 12 * 60 * 60
    })
  })

  it("auto-generates label for hours only", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const numberInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(numberInputs[1], { target: { value: "6" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "6 hours ago",
      offsetSeconds: 21600,
    })
  })

  it("auto-generates label for days only", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const numberInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(numberInputs[0], { target: { value: "2" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "2 days ago",
      offsetSeconds: 172800,
    })
  })

  it("auto-generates label for days and hours (prioritizes days)", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const numberInputs = screen.getAllByRole("spinbutton")
    fireEvent.change(numberInputs[0], { target: { value: "1" } })
    fireEvent.change(numberInputs[1], { target: { value: "6" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "1 day ago",
      offsetSeconds: 108000, // (1 * 24 * 60 * 60) + (6 * 60 * 60)
    })
  })

  it("prefers manual label over auto-generated label", () => {
    renderWithChart(<CustomPeriodForm onAdd={mockOnAdd} onCancel={mockOnCancel} />)

    const labelInput = screen.getByPlaceholderText("e.g. 3 days ago")
    const numberInputs = screen.getAllByRole("spinbutton")

    fireEvent.change(labelInput, { target: { value: "Custom name" } })
    fireEvent.change(numberInputs[0], { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Add" }))

    expect(mockOnAdd).toHaveBeenCalledWith({
      id: expect.stringMatching(/^custom_\d+$/),
      label: "Custom name",
      offsetSeconds: 259200,
    })
  })
})
