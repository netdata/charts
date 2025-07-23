import React from "react"
import { screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { render } from "@testing-library/react"
import { ThemeProvider } from "styled-components"
import { Table, DefaultTheme } from "@netdata/netdata-ui"
import { uppercase } from "@/helpers/objectTransform"
import makeMockPayload from "@/helpers/makeMockPayload"
import useHeadlessChart from "./useHeadlessChart"
import tableFixture from "../../../fixtures/table"
import { useTableMatrix } from "../table/useTableMatrix"
import { labelColumn, valueColumn } from "../table/columns"
import HeadlessChart from "."

const MultiContextTable = () => {
  const { chart, state } = useHeadlessChart()
  const { rowGroups, contextGroups, groups, labels, data } = useTableMatrix()

  if (state.loading && !state.loaded) {
    return <div data-testid="loading">Loading multi-context data...</div>
  }

  if (state.empty || !Object.keys(rowGroups).length) {
    return <div data-testid="no-data">No matrix data available</div>
  }

  const columns = [
    ...labels.map(label =>
      labelColumn(chart, {
        header: uppercase(label),
        partIndex: groups.findIndex(gi => gi === label),
      })
    ),
    ...Object.keys(contextGroups).flatMap(context =>
      Object.keys(contextGroups[context]).map(dimension =>
        valueColumn(chart, {
          contextLabel: `${context} > ${dimension}`,
          dimensionLabel: chart.intl(dimension),
          dimensionId: contextGroups[context][dimension]?.[0],
          keys: [context, dimension],
        })
      )
    ),
  ]

  return <Table data={data} dataColumns={columns} />
}

const TestWrapper = ({ children }) => <ThemeProvider theme={DefaultTheme}>{children}</ThemeProvider>

describe("HeadlessChart with Table Matrix", () => {
  it("shows no data message when matrix is empty", () => {
    render(
      <HeadlessChart getChart={makeMockPayload({}, { delay: 0 })}>
        <MultiContextTable />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    expect(screen.getByTestId("no-data")).toBeInTheDocument()
  })

  it("renders table with multi-context data using fixture", async () => {
    render(
      <HeadlessChart
        getChart={makeMockPayload(tableFixture[0], { delay: 0 })}
        contextScope={["disk.io", "disk.ops", "disk.await", "disk.util"]}
        aggregationMethod="avg"
        groupingMethod="average"
        groupBy={["label", "dimension", "context", "node"]}
        groupByLabel={["device"]}
        tableColumns={["context", "dimension"]}
      >
        <MultiContextTable />
      </HeadlessChart>,
      { wrapper: TestWrapper }
    )

    expect(await screen.findByText("Label:device")).toBeInTheDocument()
  })
})
