import { act, fireEvent, screen, waitFor, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { DefaultTheme } from "@netdata/netdata-ui"
import { makeTestChart, renderWithChart, inkOf, bubblesAround } from "@jest/testUtilities"
import systemLoadLine from "../../../../fixtures/systemLoadLine"
import Dimension from "./dimension"

const { tooltip, tooltipText } = DefaultTheme.colors

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

describe("legend Dimension tooltip", () => {
  it("renders the dimension name and value in the tooltip text colour", async () => {
    const { chart } = makeTestChart()
    await act(async () => {
      chart.doneFetch(systemLoadLine[0])
      await tick()
    })
    const [id] = chart.getDimensionIds()
    const name = chart.getDimensionName(id)

    renderWithChart(<Dimension id={id} />, { chart })

    fireEvent.mouseEnter(screen.getByTestId("chartLegendDimension-details"))

    await waitFor(() => expect(screen.getAllByText(name)).toHaveLength(2))
    const tooltipNode = screen.getAllByText(name)[1]
    expect(inkOf(tooltipNode)).toBe(tooltipText.toUpperCase())
    const value = within(tooltipNode.parentElement).getAllByText(/\d/).pop()
    expect(inkOf(value)).toBe(tooltipText.toUpperCase())
  })

  it("draws a single tooltip bubble owned by the kit", async () => {
    const { chart } = makeTestChart()
    await act(async () => {
      chart.doneFetch(systemLoadLine[0])
      await tick()
    })
    const [id] = chart.getDimensionIds()
    const name = chart.getDimensionName(id)

    renderWithChart(<Dimension id={id} />, { chart })

    fireEvent.mouseEnter(screen.getByTestId("chartLegendDimension-details"))

    await waitFor(() => expect(screen.getAllByText(name)).toHaveLength(2))
    const bubbles = bubblesAround(screen.getAllByText(name)[1], tooltip)
    expect(bubbles).toHaveLength(1)
    expect(getComputedStyle(bubbles[0]).borderRadius).toBe("6px")
  })
})
