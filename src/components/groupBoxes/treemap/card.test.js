import React from "react"
import { act, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, makeTestChart } from "@jest/testUtilities"
import makeHeatPayload from "../../../../fixtures/makeHeatPayload"
import { getBoxDetails, getRank } from "./details"
import BoxCard from "./card"

const makeChart = async () => {
  const { chart } = makeTestChart({
    mockData: makeHeatPayload(),
    attributes: {
      contextScope: ["modern.nodes.cpu"],
      chartLibrary: "groupBoxes",
      designFlavour: "modern",
    },
  })
  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  return chart
}

const id = "prod-db,prod-db-01"

describe("group boxes card", () => {
  it("reads the value, window series and stats of a box", async () => {
    const chart = await makeChart()
    const { all } = chart.getPayload()
    const details = getBoxDetails(chart, id, all[all.length - 1])

    expect(typeof details.value).toBe("number")
    expect(details.series).toHaveLength(all.length)
    expect(details.min).toBeLessThanOrEqual(details.max)
    expect(details.avg).toBeGreaterThanOrEqual(details.min)
  })

  it("ranks a box among its siblings by value", () => {
    const values = { a: 5, b: 9, c: 1 }
    expect(getRank(["a", "b", "c"], "a", key => values[key])).toEqual({ rank: 2, of: 3 })
  })

  it("shows the hover card without actions", async () => {
    const chart = await makeChart()
    const { all } = chart.getPayload()
    renderWithChart(
      <BoxCard
        id={id}
        name="prod-db-01"
        path={["prod-db"]}
        groupName="prod-db"
        rank={1}
        of={16}
        rowData={all[all.length - 1]}
      />,
      { chart }
    )

    expect(screen.getByTestId("groupBoxCard")).toBeInTheDocument()
    expect(screen.getByTestId("groupBoxCard-name")).toHaveTextContent("prod-db-01")
    expect(screen.getByTestId("groupBoxCard-rank")).toHaveTextContent("1st of 16 in prod-db")
    expect(screen.getByTestId("groupBoxCard-stats")).toHaveTextContent(/min .* avg .* max/)
    expect(screen.queryByTestId("groupBoxCard-actions")).not.toBeInTheDocument()
  })

  const renderPinned = async ({ focus, zooms }) => {
    const chart = await makeChart()
    const { all } = chart.getPayload()
    renderWithChart(
      <BoxCard
        id={id}
        name="prod-db-01"
        path={["prod-db"]}
        groupName="prod-db"
        rank={1}
        of={16}
        rowData={all[all.length - 1]}
        pinned
        focus={focus}
        onZoom={path => zooms.push(path)}
        onClose={() => {}}
      />,
      { chart }
    )
    return chart
  }

  const button = text => screen.getByText(text).closest("button")

  it("zooms in from the top level and cannot zoom out there", async () => {
    const zooms = []
    await renderPinned({ focus: [], zooms })

    expect(button("Zoom out")).toBeDisabled()
    fireEvent.click(button("Zoom into prod-db"))
    expect(zooms).toEqual([["prod-db"]])
  })

  it("zooms out from inside the group and cannot zoom into it again", async () => {
    const zooms = []
    await renderPinned({ focus: ["prod-db"], zooms })

    expect(button("Zoom into prod-db")).toBeDisabled()
    fireEvent.click(button("Zoom out"))
    expect(zooms).toEqual([[]])
  })

  it("filter actions apply real filters", async () => {
    const chart = await renderPinned({ focus: [], zooms: [] })

    await act(async () => {
      fireEvent.click(screen.getByText("Filter to group = prod-db"))
    })
    expect(chart.getAttribute("selectedLabels")).toEqual(["group:prod-db"])
  })

  it("confirms the copy and keeps the card open", async () => {
    await renderPinned({ focus: [], zooms: [] })

    await act(async () => {
      fireEvent.click(screen.getByText("Copy labels"))
    })

    expect(await screen.findByText(/Copied!|Failed to copy!/)).toBeInTheDocument()
    expect(screen.getByTestId("groupBoxCard")).toBeInTheDocument()
  })

  it("shows extra label values as a themed +N chip", async () => {
    const chart = await makeChart()
    const viewDimensions = chart.getAttribute("viewDimensions")
    chart.updateAttribute("viewDimensions", {
      ...viewDimensions,
      labels: { k8s_pod_name: viewDimensions.ids.map(() => ["a", "b", "c"]) },
    })
    const { all } = chart.getPayload()
    renderWithChart(
      <BoxCard
        id={id}
        name="prod-db-01"
        path={["prod-db"]}
        groupName="prod-db"
        rank={1}
        of={16}
        rowData={all[all.length - 1]}
      />,
      { chart }
    )

    const chip = screen.getByTestId("groupBoxCard-more")
    expect(chip).toHaveTextContent("+2")
    expect(window.getComputedStyle(chip).backgroundColor).not.toBe("")
    expect(window.getComputedStyle(chip).borderRadius).toBe("4px")
  })
})
