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

const renderLine = async attributes => {
  const { chart } = makeTestChart({ attributes: { designFlavour: "modern", ...attributes } })
  await act(async () => {
    chart.doneFetch(systemLoadLine[0])
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
    })

    const actions = screen.getAllByTestId("row-action")
    expect(actions).toHaveLength(chart.getDimensionIds().length)
    expect(actions[0]).toHaveTextContent(/^label\|device\|/)
  })

  it.each([
    [["instance"], "instance"],
    [["node"], "node"],
    [["dimension"], "dimension"],
  ])("describes %j rows as %s", async (groupBy, kind) => {
    await renderLine({ legendLayout: "table", rowAction: RowAction, groupBy })

    expect(screen.getAllByTestId("row-action")[0].textContent.startsWith(`${kind}|`)).toBe(true)
  })

  it("does not toggle the dimension when the action is clicked", async () => {
    const chart = await renderLine({ legendLayout: "table", rowAction: RowAction })

    fireEvent.click(screen.getAllByTestId("row-action")[0])

    expect(chart.getAttribute("selectedLegendDimensions")).toEqual([])
  })

  it("renders on the tooltip rows", async () => {
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
    expect(within(tooltip).getAllByTestId("row-action").length).toBeGreaterThan(0)
  })

  it("renders nothing without the attribute", async () => {
    await renderLine({ legendLayout: "table" })

    expect(screen.queryByTestId("row-action")).not.toBeInTheDocument()
  })
})
