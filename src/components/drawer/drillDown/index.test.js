import React from "react"
import { screen, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Box } from "@netdata/netdata-ui"
import { renderWithChart } from "@jest/testUtilities"
import DrillDown from "./index"

const makeWeightsResponse = (instanceCount = 2000) => ({
  request: {
    aggregations: {
      metrics: [{ group_by: ["dimension", "instance", "node"] }],
    },
  },
  v_schema: {
    items: [{ name: "weight" }, { name: "timeframe" }],
  },
  result: Array.from({ length: instanceCount * 3 }, (_, index) => {
    const nodeIndex = Math.floor(index / instanceCount)
    const instanceIndex = index % instanceCount

    return {
      id: `dimension-${index},instance-${instanceIndex},node-${nodeIndex}`,
      nm: `Dimension ${index},Instance ${instanceIndex},Node ${nodeIndex}`,
      v: [
        [0, 0, 0, 1, 1],
        [0, 1, 2, 3, 4, 0],
      ],
    }
  }),
})

const makeSearchWeightsResponse = () => ({
  request: {
    aggregations: {
      metrics: [{ group_by: ["dimension", "instance", "node"] }],
    },
  },
  v_schema: {
    items: [{ name: "weight" }, { name: "timeframe" }],
  },
  result: [
    {
      id: "target-dimension,target-instance,target-node",
      nm: "Target metric,Target instance,Target node",
      v: [
        [0, 0, 0, 77.77, 1],
        [12.34, 23.45, 34.56, 70.35, 3, 0],
      ],
    },
    {
      id: "other-dimension,other-instance,other-node",
      nm: "Other metric,Other instance,Other node",
      v: [
        [0, 0, 0, 22.23, 1],
        [45.67, 56.78, 67.89, 170.34, 3, 0],
      ],
    },
  ],
})

describe("DrillDown", () => {
  it("keeps a 6,000-row expanded hierarchy inside a virtualized table viewport", async () => {
    const { chart, user } = renderWithChart(
      <Box height={100}>
        <DrillDown />
      </Box>,
      {
        attributes: {
          drawer: { action: "compare", tab: "window" },
          drilldown: {
            groupBy: ["node", "instance", "dimension"],
            groupByLabel: [],
            data: makeWeightsResponse(),
            loading: false,
            error: null,
            sortBy: [],
            expanded: {},
            groupBySortBy: [],
            groupByExpanded: {},
          },
        },
      }
    )

    const container = screen.getByTestId("chart-drilldown-table-container")
    expect(container).toHaveStyle({ height: "100%", minHeight: "0px", overflow: "hidden" })

    await user.click(screen.getAllByText("instances")[0])

    await waitFor(() => expect(chart.getAttribute("drilldown.expanded")).not.toEqual({}))
    expect(screen.queryAllByTestId("netdata-table-row").length).toBeLessThan(2003)

    const table = screen.getByTestId("netdata-table")
    expect(table.querySelector('[data-index="0"]')).toHaveStyle({ position: "sticky" })
  })

  it("searches hierarchy labels, reveals matching descendants, and ignores measurements", async () => {
    const originalExpanded = { "other-node": true }
    const { chart, user } = renderWithChart(
      <Box height={100}>
        <DrillDown />
      </Box>,
      {
        attributes: {
          drawer: { action: "compare", tab: "window" },
          drilldown: {
            groupBy: ["node", "instance", "dimension"],
            groupByLabel: [],
            data: makeSearchWeightsResponse(),
            loading: false,
            error: null,
            sortBy: [],
            expanded: originalExpanded,
            search: "",
            groupBySortBy: [],
            groupByExpanded: {},
          },
        },
      }
    )
    const search = screen.getByPlaceholderText("Search")

    await user.type(search, "Target metric")

    await waitFor(() => expect(screen.getByText("Target metric")).toBeInTheDocument())
    expect(screen.queryByText("Target node")).not.toBeInTheDocument()
    expect(screen.queryByText("Other metric")).not.toBeInTheDocument()
    expect(chart.getAttribute("drilldown.expanded")).toEqual(originalExpanded)

    const filteredSearch = screen.getByPlaceholderText("Search")
    expect(filteredSearch).toHaveFocus()
    await user.clear(filteredSearch)
    await user.type(filteredSearch, "77.77")

    await waitFor(() => expect(screen.queryByText("Target node")).not.toBeInTheDocument())
    expect(screen.queryByText("Other node")).not.toBeInTheDocument()
  })
})
