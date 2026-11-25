import { act, fireEvent, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { Line } from "@/components/line"
import Tooltip from "./tooltip"
import systemLoadLine from "../../../../fixtures/systemLoadLine"

const tick = () => new Promise(resolve => setTimeout(resolve, 0))

const RowAction = ({ row }) => (
  <button type="button" data-testid="row-action">
    {`${row.kind}|${row.labelKey || row.id}|${row.value}`}
  </button>
)

const groupedPayload = groupedBy =>
  groupedBy
    ? {
        ...systemLoadLine[0],
        view: {
          ...systemLoadLine[0].view,
          dimensions: { ...systemLoadLine[0].view.dimensions, grouped_by: groupedBy },
        },
      }
    : systemLoadLine[0]

const renderLine = async ({ groupedBy, ...attributes }) => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", ...attributes } })
  await act(async () => {
    chart.doneFetch(groupedPayload(groupedBy))
    await tick()
  })
  renderWithChart(<Line />, { chart })
  await act(tick)
  return chart
}

describe("rowAction on legend rows", () => {
  it.each(["table", "below"])("renders per %s row, described by the group by", async layout => {
    const chart = await renderLine({
      legendLayout: layout,
      rowAction: RowAction,
      groupBy: ["label"],
      groupByLabel: ["device"],
      groupedBy: ["label:device"],
    })

    const actions = screen.getAllByTestId("row-action")
    expect(actions).toHaveLength(chart.getDimensionIds().length)
    expect(actions[0]).toHaveTextContent(/^label\|device\|/)
  })

  it.each([
    [["instance"], "instance"],
    [["node"], "node"],
    [["dimension"], "dimension"],
  ])("describes %j rows as %s", async (groupedBy, kind) => {
    await renderLine({ legendLayout: "table", rowAction: RowAction, groupBy: groupedBy, groupedBy })

    expect(screen.getAllByTestId("row-action")[0].textContent.startsWith(`${kind}|`)).toBe(true)
  })

  it("describes the rows by the grouping the server applied, not the one requested", async () => {
    await renderLine({
      legendLayout: "table",
      rowAction: RowAction,
      groupBy: ["label"],
      groupByLabel: ["device"],
      groupedBy: ["node"],
    })

    expect(screen.getAllByTestId("row-action")[0]).toHaveTextContent(/^node\|/)
  })

  it.each([
    ["several label keys", ["label:device", "label:mount"]],
    ["a label and the node", ["label:device", "node"]],
    ["the selected series", ["selected"]],
  ])("offers no action when rows are grouped by %s", async (_, groupedBy) => {
    await renderLine({
      legendLayout: "table",
      rowAction: RowAction,
      groupBy: ["label"],
      groupByLabel: ["device"],
      groupedBy,
    })

    expect(screen.queryByTestId("row-action")).not.toBeInTheDocument()
  })

  it("offers no action when the rows are aggregated again after grouping", async () => {
    await renderLine({
      legendLayout: "table",
      rowAction: RowAction,
      groupBy: ["label"],
      groupByLabel: ["device"],
      groupedBy: ["label:device"],
      showPostAggregations: true,
      postGroupBy: ["node"],
    })

    expect(screen.queryByTestId("row-action")).not.toBeInTheDocument()
  })

  it("does not toggle the dimension when the action is clicked", async () => {
    const chart = await renderLine({ legendLayout: "table", rowAction: RowAction })

    fireEvent.click(screen.getAllByTestId("row-action")[0])

    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([])
  })

  it("keeps the action out of the hover tooltip, which the pointer cannot reach", async () => {
    const { chart } = makeTestChart({
      attributes: { designFlavour: "modern", rowAction: RowAction },
    })
    await act(async () => {
      chart.doneFetch(systemLoadLine[0])
      await tick()
    })
    const [timestamp] = chart.getPayload().all[5]
    chart.updateAttribute("hoverX", [timestamp, "load1"])
    renderWithChart(<Tooltip />, { chart })

    const tooltip = screen.getByTestId("modernTooltip")
    expect(within(tooltip).getAllByTestId("modernTooltip-name").length).toBeGreaterThan(0)
    expect(within(tooltip).queryByTestId("row-action")).not.toBeInTheDocument()
  })

  it("places the inline legend action beside the toggle, not inside it", async () => {
    const consoleError = jest.spyOn(console, "error")
    try {
      await renderLine({ legendLayout: "below", rowAction: RowAction, groupedBy: ["node"] })

      const [action] = screen.getAllByTestId("row-action")
      const nestingErrors = consoleError.mock.calls.filter(([message]) =>
        /cannot (be a descendant of|contain a nested)/.test(String(message))
      )
      expect(nestingErrors).toEqual([])

      fireEvent.click(action)
      expect(screen.getAllByTestId("modernLegend-entry")[0]).toHaveStyle({ opacity: "1" })
    } finally {
      consoleError.mockRestore()
    }
  })

  it("renders nothing without the attribute", async () => {
    await renderLine({ legendLayout: "table" })

    expect(screen.queryByTestId("row-action")).not.toBeInTheDocument()
  })
})
