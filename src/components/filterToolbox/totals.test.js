import React from "react"
import "@testing-library/jest-dom"
import { renderWithChart, simulateTranslate, collectRenderErrors } from "@jest/testUtilities"
import Totals from "./totals"

describe("Totals", () => {
  it("survives page translation when fl goes from 0 to a failed count", () => {
    const before = { qr: 5, fl: 0, sl: 10, ex: 0, teaser: false }
    const after = { ...before, fl: 3 }

    const { container, rerender } = renderWithChart(<Totals {...before} />)
    simulateTranslate(container)

    expect(collectRenderErrors(() => rerender(<Totals {...after} />))).toEqual([])
    expect(container).toHaveTextContent("5 queried+ 3failed of 10 selectedof 10 available")
  })

  it("survives page translation when couldBeMore goes from false to true", () => {
    const before = { qr: 10, fl: 0, sl: 10, ex: 0, teaser: true, resourceName: "node" }
    const after = { ...before, qr: 7 }

    const { container, rerender } = renderWithChart(<Totals {...before} />)
    simulateTranslate(container)

    expect(collectRenderErrors(() => rerender(<Totals {...after} />))).toEqual([])
    expect(container).toHaveTextContent("7 of 10 nodes")
  })
})
