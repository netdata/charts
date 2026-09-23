import React from "react"
import "@testing-library/jest-dom"
import { renderWithChart, simulateTranslate, collectRenderErrors } from "@jest/testUtilities"
import { AnnotationContent } from "./index"

describe("AnnotationContent", () => {
  it("survives page translation when author is removed", () => {
    const annotation = {
      text: "Deploy",
      timestamp: 1700000000,
      color: "#0075F2",
      priority: "info",
      author: "SRE Team",
    }

    const { container, rerender } = renderWithChart(<AnnotationContent annotation={annotation} />)
    simulateTranslate(container)

    // eslint-disable-next-line no-unused-vars
    const { author, ...withoutAuthor } = annotation

    expect(
      collectRenderErrors(() => rerender(<AnnotationContent annotation={withoutAuthor} />))
    ).toEqual([])
    expect(container.textContent).toBe("DeployTue, Nov 14, 2023 • 22:13:20 • Info")
  })
})
