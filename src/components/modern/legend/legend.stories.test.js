import React from "react"
import { act, render, screen } from "@testing-library/react"
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

    expect(screen.getAllByTestId("modernBody")).toHaveLength(8)
  })
})
