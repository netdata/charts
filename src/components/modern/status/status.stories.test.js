import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Light, Dark } from "./status.stories"

describe("Modern/Status stories", () => {
  it.each([
    ["light", Light],
    ["dark", Dark],
  ])("renders every status state in %s", (_, Story) => {
    render(<Story />)

    expect(screen.getAllByTestId("modernStatusStory-card")).toHaveLength(6)
    expect(screen.getAllByTestId("modernStatus").map(node => node.dataset.status)).toEqual([
      "clear",
      "warning",
      "critical",
      "critical",
      "warning",
    ])
    expect(screen.getByText("1 warning")).toBeInTheDocument()
    expect(screen.getByText("2 critical")).toBeInTheDocument()
    expect(screen.getAllByTestId("modernStatus-label").map(node => node.textContent)).toEqual([
      "1 warning",
      "2 critical",
      "8 critical",
      "Warning",
    ])
  })
})
