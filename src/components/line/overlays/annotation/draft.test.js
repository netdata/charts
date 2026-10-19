import React from "react"
import "@testing-library/jest-dom"
import { act, fireEvent, screen } from "@testing-library/react"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import DraftAnnotation from "./draft"

const timestamp = 1617946865
const clickX = [timestamp * 1000, null]

const renderDraft = (designFlavour = "modern", attributes = {}) => {
  const { chart, sdk } = makeTestChart({
    attributes: {
      ...attributes,
      designFlavour,
      clickX,
      draftAnnotation: { timestamp, createdAt: new Date(), status: "draft" },
    },
  })
  renderWithChart(<DraftAnnotation />, { chart })
  return { chart, sdk }
}

describe("DraftAnnotation click actions", () => {
  it("shows the actions for the clicked time in the modern flavour", () => {
    renderDraft()

    expect(screen.getByTestId("click-actions")).toBeInTheDocument()
    expect(screen.getByTestId("click-actions-annotate")).toBeInTheDocument()
    expect(screen.getByTestId("click-actions-copy")).toBeInTheDocument()
    expect(screen.getByTestId("click-actions-clear")).toBeInTheDocument()
    expect(screen.getByTestId("click-actions-close")).toBeInTheDocument()
    expect(screen.queryByText("New annotation")).not.toBeInTheDocument()
  })

  it("opens the annotation form", () => {
    const { chart } = renderDraft()

    fireEvent.click(screen.getByTestId("click-actions-annotate"))

    expect(chart.getAttribute("draftAnnotation").status).toBe("editing")
    expect(screen.getByPlaceholderText("Annotation text...")).toBeInTheDocument()
  })

  it("closes the actions and keeps the clicked point", () => {
    const { chart } = renderDraft()

    act(() => fireEvent.click(screen.getByTestId("click-actions-close")))

    expect(chart.getAttribute("draftAnnotation")).toBeNull()
    expect(chart.getAttribute("clickX")).toEqual(clickX)
  })

  it("clears the clicked point and tells the sdk", () => {
    const { chart, sdk } = renderDraft()
    const cleared = []
    sdk.on("clickPointClear", target => cleared.push(target))

    act(() => fireEvent.click(screen.getByTestId("click-actions-clear")))

    expect(chart.getAttribute("draftAnnotation")).toBeNull()
    expect(chart.getAttribute("clickX")).toBeNull()
    expect(cleared).toEqual([chart])
  })

  it("hides the annotate action when annotations cannot be created", () => {
    renderDraft("modern", { canCreateAnnotations: false })

    expect(screen.queryByTestId("click-actions-annotate")).not.toBeInTheDocument()
    expect(screen.getByTestId("click-actions-clear")).toBeInTheDocument()
  })

  it("keeps the annotation box in the default flavour", () => {
    renderDraft("default")

    expect(screen.getByText("New annotation")).toBeInTheDocument()
    expect(screen.queryByTestId("click-actions")).not.toBeInTheDocument()
  })
})
