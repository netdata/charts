import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Dark, Light } from "./legend.stories"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe("Modern/Legend and hover story", () => {
  it.each([
    ["light", Light],
    ["dark", Dark],
  ])("renders every card in %s", async (_, Story) => {
    render(<Story {...Story.args} />)
    await act(tick)

    const bodies = screen.getAllByTestId("modernBody")
    expect(bodies).toHaveLength(10)
    expect(bodies[2]).toHaveAttribute("data-legend", "live")
    await waitFor(() => expect(bodies[7]).toHaveAttribute("data-legend", "table"))
  })
})
