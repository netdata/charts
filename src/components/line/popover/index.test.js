import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import Popover, { getPopoverPosition } from "."

const waitForFrame = () =>
  new Promise(resolve => window.requestAnimationFrame(() => resolve()))

describe("getPopoverPosition", () => {
  it.each([
    {
      expected: { align: { left: "right", top: "bottom" }, x: 100, y: 80 },
      pointerX: 100,
      pointerY: 80,
    },
    {
      expected: { align: { right: "left", top: "bottom" }, x: 350, y: 80 },
      pointerX: 450,
      pointerY: 80,
    },
    {
      expected: { align: { bottom: "top", left: "right" }, x: 100, y: 270 },
      pointerX: 100,
      pointerY: 350,
    },
    {
      expected: { align: { bottom: "top", right: "left" }, x: 350, y: 270 },
      pointerX: 450,
      pointerY: 350,
    },
  ])("positions the popover in the available quadrant", ({ expected, pointerX, pointerY }) => {
    expect(
      getPopoverPosition({
        height: 80,
        pointerX,
        pointerY,
        viewportHeight: 400,
        viewportWidth: 500,
        width: 100,
      })
    ).toEqual(expected)
  })

  it("keeps an oversized popover inside the viewport origin", () => {
    expect(
      getPopoverPosition({
        height: 500,
        pointerX: 50,
        pointerY: 50,
        viewportHeight: 400,
        viewportWidth: 500,
        width: 600,
      })
    ).toMatchObject({ x: 0, y: 0 })
  })
})

describe("Popover", () => {
  it("moves to the latest pointer position without remeasuring on every move", async () => {
    const { chart } = makeTestChart()

    renderWithChart(<Popover />, { chart })

    await act(async () => {
      chart.getUI().trigger("mousemove", { clientX: 100, clientY: 80 })
      await waitForFrame()
    })

    const drop = screen.getByTestId("drop")
    let geometryReads = 0

    drop.getBoundingClientRect = () => {
      geometryReads += 1
      return { height: 120, width: 120 }
    }

    await act(async () => {
      chart.getUI().trigger("mousemove", { clientX: 160, clientY: 120 })
      chart.getUI().trigger("mousemove", { clientX: 220, clientY: 160 })
      chart.getUI().trigger("mousemove", { clientX: 280, clientY: 200 })
      await waitForFrame()
    })

    expect(drop.style.transform).toBe("translate3d(280px, 200px, 0)")
    expect(geometryReads).toBe(0)
  })
})
