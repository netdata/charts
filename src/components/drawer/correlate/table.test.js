import React from "react"
import { fireEvent, screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Box } from "@netdata/netdata-ui"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import CorrelationTable from "./table"

const makeDimension = (contextIndex, dimensionIndex, overrides = {}) => ({
  rowId: JSON.stringify(["dimension", contextIndex, dimensionIndex]),
  kind: "dimension",
  dimension: `dimension-${contextIndex}-${String(dimensionIndex).padStart(5, "0")}`,
  dimensionName: `Dimension ${contextIndex}-${dimensionIndex}`,
  context: `context-${contextIndex}`,
  contextName: `Context ${contextIndex}`,
  nodeId: `node-${dimensionIndex}`,
  nodeName: `Node ${dimensionIndex}`,
  correlationWeight: 0.005,
  correlationStrength: "Strong",
  percentChange: 5,
  ...overrides,
})

const makeData = contextCount =>
  Array.from({ length: contextCount }, (_, contextIndex) => ({
    rowId: JSON.stringify(["context", contextIndex]),
    kind: "context",
    context: `context-${contextIndex}`,
    contextName: `Context ${contextIndex}`,
    minWeight: 0.005,
    count: 2,
    children: [makeDimension(contextIndex, 0), makeDimension(contextIndex, 1)],
  }))

describe("CorrelationTable", () => {
  it("virtualizes high-cardinality rows and persists expansion in chart attributes", async () => {
    const data = makeData(1000)
    const { chart, user } = renderWithChart(
      <Box height="400px">
        <CorrelationTable data={data} />
      </Box>,
      {
        attributes: {
          correlate: { expanded: {} },
        },
      }
    )

    expect(
      screen.getByText("Found 2000 correlated dimensions across 1000 contexts")
    ).toBeInTheDocument()
    await waitFor(() => {
      const renderedRows = screen.queryAllByTestId("netdata-table-row")
      expect(renderedRows.length).toBeGreaterThan(0)
      expect(renderedRows.length).toBeLessThan(data.length)
    })

    await user.click(screen.getByRole("button", { name: "Expand all" }))

    expect(chart.getAttribute("correlate.expanded")).toBe(true)
    expect(screen.queryAllByTestId("netdata-table-row").length).toBeLessThan(3000)
  })

  it("fetches and renders trends only for the visible batch", async () => {
    const children = Array.from({ length: 5000 }, (_, index) =>
      makeDimension(0, index, { nodeId: "shared-node" })
    )
    const data = [
      {
        rowId: JSON.stringify(["context", 0]),
        kind: "context",
        context: "context-0",
        contextName: "Context 0",
        minWeight: 0.005,
        count: children.length,
        children,
      },
    ]
    const requests = []
    const { sdk, chart } = makeTestChart({
      attributes: {
        after: 100,
        before: 200,
        correlate: { expanded: {} },
        points: 300,
      },
    })
    chart.getChart = async requestChart => {
      const dimensions = requestChart.getAttribute("selectedDimensions")
      requests.push(dimensions)

      return {
        view: { dimensions: { units: dimensions.map(() => "requests/s") } },
        result: {
          labels: ["time", ...dimensions],
          point: { value: 0 },
          data: [
            [1000, ...dimensions.map((dimension, index) => [index + 1])],
            [1005, ...dimensions.map((dimension, index) => [index + 2])],
          ],
        },
      }
    }
    const { user } = renderWithChart(
      <Box height="400px">
        <CorrelationTable data={data} />
      </Box>,
      { chart }
    )

    await user.click(screen.getByRole("button", { name: "Expand all" }))

    const table = screen.getByTestId("netdata-table")
    table.scrollTop = 35
    fireEvent.scroll(table)

    await waitFor(() =>
      expect(screen.getAllByRole("img", { name: "Metric trend" })).not.toHaveLength(0)
    )
    await waitFor(() => expect(requests).toHaveLength(1))

    expect(requests[0]).toHaveLength(50)
    expect(screen.getAllByRole("img", { name: "Metric trend" }).length).toBeLessThan(
      children.length
    )
    expect(sdk.getRoot().getChildren()).toEqual([chart])
  })

  it("searches visible metric identity text and ignores raw measurements", async () => {
    const originalExpanded = { preserved: true }
    const data = [
      {
        rowId: JSON.stringify(["context", "shared"]),
        kind: "context",
        context: "shared.context",
        contextName: "Shared context",
        minWeight: 0.005,
        count: 2,
        children: [
          makeDimension(0, 0, {
            dimension: "target-dimension",
            dimensionName: "Target metric",
            context: "target.context",
            contextName: "Shared context",
            nodeId: "target-node-id",
            nodeName: "Target node",
            correlationWeight: 0.005,
          }),
          makeDimension(0, 1, {
            dimension: "other-dimension",
            dimensionName: "Other metric",
            context: "other.context",
            contextName: "Shared context",
            nodeId: "other-node-id",
            nodeName: "Other node",
            correlationWeight: 0.007,
          }),
        ],
      },
    ]
    const { chart, user } = renderWithChart(
      <Box height="400px">
        <CorrelationTable data={data} />
      </Box>,
      {
        attributes: {
          correlate: { expanded: originalExpanded, search: "" },
        },
      }
    )
    const search = screen.getByPlaceholderText("Search")

    await user.type(search, "Target node")

    await waitFor(() => expect(screen.getByText("Target metric")).toBeInTheDocument())
    expect(screen.getByTestId("value-unit-detail")).toHaveTextContent("Strong")
    expect(screen.queryByText("Other metric")).not.toBeInTheDocument()
    expect(chart.getAttribute("correlate.expanded")).toEqual(originalExpanded)

    const filteredSearch = screen.getByPlaceholderText("Search")
    expect(filteredSearch).toHaveFocus()
    await user.clear(filteredSearch)
    await user.type(filteredSearch, "0.005")

    await waitFor(() => expect(screen.queryByText("Shared context")).not.toBeInTheDocument())
  })
})
