import React from "react"
import { fireEvent } from "@testing-library/react"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import uplotChart from "@/chartLibraries/uplot"
import Annotation from "./index"

const after = 1617946860
const before = 1617947760
const timestamp = after + 5

const withLoadedPayload = chart => {
  chart.getPayload = () => ({
    data: [
      [after * 1000, 10, 20, 30],
      [(after + 5) * 1000, 12, 18, 28],
      [(after + 10) * 1000, 11, 22, 31],
    ],
    labels: ["time", "load1", "load5", "load15"],
  })
  chart.getPayloadDimensionIds = () => ["load1", "load5", "load15"]
  chart.getVisibleDimensionIds = () => ["load1", "load5", "load15"]
  chart.isDimensionVisible = () => true
  chart.selectDimensionColor = () => "#3366CC"
  chart.getThemeAttribute = () => "#E4E8E8"
  chart.getConvertedValueWithUnit = value => `${value}`
}

const setup = async () => {
  const { sdk, chart } = makeTestChart({
    attributes: {
      loaded: true,
      chartType: "line",
      chartLibrary: "uplot",
      after,
      before,
      staticValueRange: [5, 40],
      overlays: {
        "ann-1": { type: "annotation", timestamp, text: "deploy", color: "#ff0000" },
      },
    },
  })
  withLoadedPayload(chart)

  const instance = uplotChart(sdk, chart)
  const element = document.createElement("div")
  element.style.width = "800px"
  element.style.height = "300px"
  document.body.appendChild(element)
  instance.mount(element)
  chart.setUI(instance)
  await Promise.resolve()
  await Promise.resolve()

  return {
    sdk,
    chart,
    instance,
    element,
    teardown: () => (instance.unmount(), document.body.removeChild(element)),
  }
}

describe("Annotation popover proximity (renderer-agnostic)", () => {
  it("shows the popover for chartLibrary uplot when the cursor is near the annotation", async () => {
    const { chart, instance, element, teardown } = await setup()

    const getXCoordSpy = jest.spyOn(instance, "getXCoord")

    const { queryByText } = renderWithChart(<Annotation id="ann-1" />, { chart })

    expect(queryByText("deploy")).toBeNull()

    const annotationX = instance.getXCoord(timestamp * 1000)
    fireEvent.mouseMove(element, { clientX: annotationX, clientY: 50 })

    expect(getXCoordSpy).toHaveBeenCalled()
    expect(queryByText("deploy")).not.toBeNull()

    getXCoordSpy.mockRestore()
    teardown()
  })

  it("keeps the popover hidden when the cursor is far from the annotation", async () => {
    const { chart, instance, element, teardown } = await setup()

    const { queryByText } = renderWithChart(<Annotation id="ann-1" />, { chart })

    const annotationX = instance.getXCoord(timestamp * 1000)
    fireEvent.mouseMove(element, { clientX: annotationX + 200, clientY: 50 })

    expect(queryByText("deploy")).toBeNull()

    teardown()
  })
})
