import React from "react"
import { screen, act } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart } from "@jest/testUtilities"
import overlayComponents from "@/components/line/overlays/types"

const { alarm: AlarmOverlay, alarmRange: AlarmRangeOverlay, highlight: HighlightOverlay } =
  overlayComponents

const emit = (chart, id, area) =>
  act(() => {
    chart.getUI().trigger(`overlayedAreaChanged:${id}`, area)
  })

describe("uplot overlay badges", () => {
  it("renders the alarm badge for a uPlot chart once its area is emitted", () => {
    const { chart } = renderWithChart(<AlarmOverlay id="alarm-1" />, {
      attributes: {
        chartLibrary: "uplot",
        overlays: { "alarm-1": { type: "alarm", status: "critical", value: 42 } },
      },
    })

    expect(screen.queryByText(/Triggered value:/)).toBeNull()

    emit(chart, "alarm-1", { from: 10, to: 50, width: 40 })

    expect(screen.getByText(/Triggered value:/)).toBeInTheDocument()
    expect(screen.getByText("42")).toBeInTheDocument()
  })

  it("renders the alarmRange badge for a uPlot chart once its area is emitted", () => {
    const { chart } = renderWithChart(<AlarmRangeOverlay id="range-1" />, {
      attributes: {
        chartLibrary: "uplot",
        overlays: {
          "range-1": { type: "alarmRange", status: "warning", valueTriggered: 7 },
        },
      },
    })

    emit(chart, "range-1", { from: 10, to: 120, width: 110 })

    expect(screen.getByText(/Triggered value:/)).toBeInTheDocument()
    expect(screen.getByText("7")).toBeInTheDocument()
  })

  it("renders the highlight badge for a focused uPlot chart once its area is emitted", () => {
    const { chart } = renderWithChart(<HighlightOverlay id="highlight" />, {
      attributes: {
        chartLibrary: "uplot",
        focused: true,
        hasCorrelation: false,
        overlays: { highlight: { type: "highlight", range: [1617946920, 1617947160] } },
      },
    })

    emit(chart, "highlight", { from: 100, to: 300, width: 200 })

    expect(screen.getByText("Range")).toBeInTheDocument()
  })
})
