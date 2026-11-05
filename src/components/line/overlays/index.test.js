import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import Overlays from "."

test.each([true, false])(
  "the React overlay layer renders the draft annotation only while annotations are enabled (%s)",
  enabled => {
    const { chart, unmount } = renderWithChart(<Overlays uiName="default" />, {
      attributes: {
        enabledAnnotations: enabled,
        draftAnnotation: { timestamp: 1617946900, status: "draft" },
      },
    })
    act(() =>
      chart.getUI().trigger("overlayedAreaChanged:draftAnnotation", { from: 10, to: 10, width: 0 })
    )
    expect(screen.queryByText("New annotation") !== null).toBe(enabled)
    unmount()
    chart.destroy()
  }
)
