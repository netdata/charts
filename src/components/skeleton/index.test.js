import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import { Skeleton as GaugeSkeleton } from "@/components/modern/gauge"
import { HorizonSkeleton, BlockSkeleton, RingSkeleton } from "."

const cases = [
  ["horizon", <HorizonSkeleton key="h" data-testid="skeleton-root" />],
  ["block", <BlockSkeleton key="b" data-testid="skeleton-root" />],
  ["ring", <RingSkeleton key="r" data-testid="skeleton-root" />],
]

const transitionOf = element => window.getComputedStyle(element).transition

describe("skeleton colour ramp", () => {
  it.each(cases)("eases the %s skeleton colours between loading steps", (_, element) => {
    renderWithChart(element)

    const shape = screen.getByTestId("skeleton-root").querySelector("path, rect")
    expect(transitionOf(shape)).toContain("500ms linear")
    expect(transitionOf(shape)).toMatch(/fill|stroke/)
  })

  it("eases the gradient stops", () => {
    renderWithChart(<HorizonSkeleton data-testid="skeleton-root" />)

    const stop = screen.getByTestId("skeleton-root").querySelector("stop")
    expect(transitionOf(stop)).toContain("stop-color 500ms linear")
  })

  it("eases the modern gauge skeleton", () => {
    renderWithChart(<GaugeSkeleton />)

    const path = screen.getByTestId("modernGauge-skeleton").querySelector("path")
    expect(transitionOf(path)).toContain("500ms linear")
  })
})
