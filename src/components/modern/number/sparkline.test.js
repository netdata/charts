import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithProviders } from "@jest/testUtilities"
import Sparkline, { makePaths, makeScale, toRuns } from "./sparkline"

describe("toRuns", () => {
  it("splits the series at gaps", () => {
    expect(toRuns([1, 2, null, 4, 5, null])).toEqual([
      [
        [0, 1],
        [1, 2],
      ],
      [
        [3, 4],
        [4, 5],
      ],
    ])
  })

  it("returns no runs for an empty series", () => {
    expect(toRuns([null, null])).toEqual([])
  })
})

describe("makeScale", () => {
  it("maps the max to the top padding and keeps headroom under the min", () => {
    const y = makeScale([0, 10])

    expect(y(10)).toBeCloseTo(6)
    expect(y(0)).toBeLessThan(100)
    expect(y(0)).toBeGreaterThan(y(10))
  })

  it("handles a flat series", () => {
    const y = makeScale([5, 5, 5])

    expect(Number.isFinite(y(5))).toBe(true)
  })

  it("returns null without numbers", () => {
    expect(makeScale([null])).toBeNull()
  })
})

describe("makePaths", () => {
  it("draws one sub-path per run and closes the area to the bottom", () => {
    const { line, area } = makePaths([1, 2, null, 3, 4])

    expect(line.match(/M/g)).toHaveLength(2)
    expect(area.match(/Z/g)).toHaveLength(2)
    expect(area).toContain("L1,100")
  })
})

describe("Sparkline", () => {
  it("renders nothing for fewer than two points", () => {
    const { container } = renderWithProviders(
      <Sparkline values={[1]} color="text" id="a" height={30} markerIndex={0} />
    )

    expect(container.firstChild).toBeNull()
  })

  it("renders the line, the area gradient and the marker", () => {
    const { container } = renderWithProviders(
      <Sparkline values={[1, 3, 2]} color="#123456" id="spark" height={30} markerIndex={2} />
    )

    expect(screen.getByTestId("modernNumberSpark")).toBeInTheDocument()
    expect(container.querySelector("linearGradient#modern-number-spark-spark")).not.toBeNull()
    expect(container.querySelectorAll("path")).toHaveLength(2)
    expect(screen.getByTestId("modernNumberSparkMarker").style.left).toBe("100%")
  })

  it("hides the marker on a gap", () => {
    renderWithProviders(
      <Sparkline values={[1, 3, null]} color="text" id="gap" height={30} markerIndex={2} />
    )

    expect(screen.queryByTestId("modernNumberSparkMarker")).not.toBeInTheDocument()
  })
})
