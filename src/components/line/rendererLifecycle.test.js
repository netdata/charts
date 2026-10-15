import React from "react"
import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { makePayload, makeWave } from "../../../fixtures/makeWavePayload"
import { usePlotArea } from "@/components/provider"
import ChartContainer from "@/components/chartContainer"
import { Line } from "."
import Popover from "./popover"
import OverlayContainer, { alignment } from "./overlays/container"

const payload = makePayload({
  context: "system.cpu",
  title: "CPU",
  unit: "%",
  dimensions: [{ id: "user", values: makeWave({ center: 50, amplitude: 30 }) }],
})
const { after, before } = payload.view
const timestamp = after + 100
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve))
const makeRendererChart = async (attributes = {}) => {
  const view = makeTestChart({
    attributes: { after, before, autoPlay: false, active: false, ...attributes },
  })
  view.chart.doneFetch(payload)
  await new Promise(resolve => setTimeout(resolve, 0))
  return view
}
const switchRenderer = async (chart, sdk, renderer) => {
  act(() => sdk.getRoot().updateAttribute("timeSeriesRenderer", renderer))
  await act(nextFrame)
  const ui = chart.getUI()
  expect(ui.getElement()).not.toBeNull()
  expect(renderer === "uplot" ? ui.getUPlot() : ui.getDygraph()).not.toBeNull()
  return ui
}

describe("mounted time-series renderer lifecycle", () => {
  it("keeps saved annotations hoverable when switching to uPlot and back", async () => {
    const { chart, sdk } = await makeRendererChart({
      overlays: { saved: { type: "annotation", timestamp, text: "Deployment marker" } },
      hasToolbox: false,
    })
    const view = renderWithChart(
      <Line hasHeader={false} hasFooter={false} hasFilters={false} height="280px" />,
      { chart }
    )
    try {
      for (const renderer of [null, "uplot", null]) {
        const ui = await switchRenderer(chart, sdk, renderer)
        const element = ui.getElement()
        const rect = element.getBoundingClientRect()
        fireEvent.mouseMove(element, {
          clientX: rect.left + ui.getXCoord(timestamp * 1000),
          clientY: rect.top + 40,
        })
        await waitFor(() => expect(screen.getByText("Deployment marker")).toBeVisible())
        fireEvent.mouseLeave(element)
        await waitFor(() => expect(screen.queryByText("Deployment marker")).toBeNull(), {
          timeout: 1500,
        })
      }
    } finally {
      view.unmount()
      chart.destroy()
    }
  })

  it("keeps ordinary metric popovers bound to the replacement UI", async () => {
    const { chart, sdk } = await makeRendererChart()
    const view = renderWithChart(
      <>
        <ChartContainer />
        <Popover />
      </>,
      { chart }
    )
    try {
      for (const renderer of [null, "uplot", null]) {
        const ui = await switchRenderer(chart, sdk, renderer)
        await act(async () => {
          ui.trigger("mousemove", {
            clientX: 100,
            clientY: 70,
            target: ui.getElement(),
            type: "mousemove",
          })
          await nextFrame()
        })
        expect(screen.getByTestId("drop")).toBeVisible()
        act(() => ui.trigger("mouseout"))
        expect(screen.queryByTestId("drop")).toBeNull()
      }
    } finally {
      view.unmount()
      chart.destroy()
    }
  })

  it("keeps plot-area consumers reacting to replacement UI resize events", async () => {
    const { chart, sdk } = await makeRendererChart()
    const PlotArea = () => <output data-testid="plot-width">{usePlotArea().width}</output>
    const view = renderWithChart(
      <>
        <ChartContainer />
        <PlotArea />
      </>,
      { chart }
    )
    try {
      for (const renderer of ["uplot", null]) {
        const ui = await switchRenderer(chart, sdk, renderer)
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 350))
        })
        const previousWidth = ui.getPlotArea().width
        act(() => {
          ui.getElement().style.width = renderer ? "700px" : "500px"
          ui.trigger("resize")
        })
        await act(nextFrame)
        expect(ui.getPlotArea().width).not.toBe(previousWidth)
        expect(Number(screen.getByTestId("plot-width").textContent)).toBe(ui.getPlotArea().width)
      }
    } finally {
      view.unmount()
      chart.destroy()
    }
  })

  it("keeps overlay labels aligned with the replacement renderer's native line", async () => {
    const { chart, sdk } = await makeRendererChart({
      overlays: { saved: { type: "annotation", timestamp, text: "Native line" } },
    })
    const view = renderWithChart(
      <>
        <ChartContainer />
        <OverlayContainer id="saved" align={alignment.elementRight} right={-5}>
          <span>Overlay label</span>
        </OverlayContainer>
      </>,
      { chart }
    )
    try {
      for (const renderer of [null, "uplot", null]) {
        const ui = await switchRenderer(chart, sdk, renderer)
        act(() => {
          ui.getElement().style.width = renderer ? "700px" : "500px"
          ui.trigger("resize")
        })
        await act(nextFrame)
        const right = screen.getByText("Overlay label").parentElement.style.right
        expect(Number(right.match(/- ([\d.]+)px/)[1])).toBeCloseTo(
          ui.getXCoord(timestamp * 1000) - 5
        )
      }
    } finally {
      view.unmount()
      chart.destroy()
    }
  })
})
