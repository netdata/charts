import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, renderHookWithChart, makeTestChart } from "@jest/testUtilities"
import { TableChart } from "@/components/table"
import useTableColumns from "@/components/table/useTableColumns"
import Settings from "@/components/toolbox/settings"
import Fullscreen from "@/components/toolbox/fullscreen"
import tableFixture from "../../../../fixtures/table"
import { getRowStatus } from "./status"
import { getTrend, makeTrendPath } from "./trend"
import { clampPercent } from "./meter"
import { isPercentUnit, getMergedLabelVisibility, missingValueText } from "./columns"
import { getShare, isHotPercent, getContextScale } from "./scale"
import { getTableStatus } from "./header"
import { getColumnOptions } from "./menu"
import makeTablePayload, { withoutDimensions, withValue, findDimension } from "./makeTablePayload"

const makeTableChart = async (designFlavour = "default", { payload, attributes } = {}) => {
  const { chart } = makeTestChart({
    mockData: payload || tableFixture[0],
    attributes: {
      contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
      chartLibrary: "table",
      tableColumns: ["context", "dimension"],
      designFlavour,
      ...attributes,
    },
  })

  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  return chart
}

const settle = (ms = 350) =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, ms))
  })

const renderTable = async (designFlavour, options) => {
  const chart = await makeTableChart(designFlavour, options)
  const result = renderWithChart(<TableChart />, { chart })

  await settle()

  return { ...result, chart }
}

const missingId = findDimension(
  tableFixture[0],
  id => id.startsWith("writes,dm-0,") && id.endsWith(",disk.await")
)

const hotId = findDimension(tableFixture[0], id => id.startsWith("utilization,sda,"))

const missingPayload = withoutDimensions(tableFixture[0], [missingId])

const cellsOf = (row, column) =>
  row.querySelector(`[data-testid="netdata-table-cell-${column}"]`) || null

const columnCells = (container, column) =>
  Array.from(getRows(container))
    .map(row => cellsOf(row, column))
    .filter(Boolean)

const getRows = container => container.querySelectorAll('[data-testid^="netdata-table-row"]')

const mgOf = chart => {
  const nodes = chart.getAttribute("nodes")
  return Object.values(nodes).map(node => node.mg)
}

describe("modern table", () => {
  describe("default flavour stays as it is", () => {
    it("renders colour swatches and none of the modern cells", async () => {
      const { container } = await renderTable("default")

      expect(getRows(container).length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("chartDimensions-color").length).toBeGreaterThan(0)
      expect(screen.queryByTestId("modernTable-status")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernTable-meter")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernTable-trend")).not.toBeInTheDocument()
      expect(screen.queryByTestId("modernTable-header")).not.toBeInTheDocument()
      expect(screen.getAllByTestId("value-unit-grid").length).toBeGreaterThan(0)
    })

    it("keeps the same headers and row names", async () => {
      const { container } = await renderTable("default")

      expect(screen.getByText("Label:device")).toBeInTheDocument()
      expect(screen.getByText("Node")).toBeInTheDocument()
      expect(screen.getAllByText("reads").length).toBeGreaterThan(0)
      expect(screen.getAllByText("utilization").length).toBeGreaterThan(0)
      expect(container.textContent).toContain("lab-cloud-unpaid")
    })

    it("minimal flavour renders the default cells too", async () => {
      await renderTable("minimal")

      expect(screen.getAllByTestId("chartDimensions-color").length).toBeGreaterThan(0)
      expect(screen.queryByTestId("modernTable-status")).not.toBeInTheDocument()
    })
  })

  describe("modern flavour", () => {
    it("renders the same rows and headers as the default flavour", async () => {
      const { container: defaultContainer, unmount } = await renderTable("default")
      const defaultRows = getRows(defaultContainer).length
      unmount()

      const { container } = await renderTable("modern")

      expect(getRows(container).length).toBe(defaultRows)
      expect(screen.getByText("Label:device")).toBeInTheDocument()
      expect(screen.getByText("Node")).toBeInTheDocument()
      expect(container.textContent).toContain("lab-cloud-unpaid")
    })

    it("replaces the colour swatch with a status dot per row", async () => {
      const { container } = await renderTable("modern")

      expect(screen.queryByTestId("chartDimensions-color")).not.toBeInTheDocument()
      const dots = screen.getAllByTestId("modernTable-status")
      expect(dots).toHaveLength(getRows(container).length)
      dots.forEach(dot => expect(dot).toHaveAttribute("data-status", "clear"))
    })

    it("draws a magnitude bar behind every number and trends outside percentage columns", async () => {
      const { container } = await renderTable("modern")
      const values = screen.getAllByTestId("modernTable-value")

      expect(values.length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("modernTable-bar")).toHaveLength(values.length)
      expect(screen.getAllByTestId("modernTable-trend").length).toBeGreaterThan(0)
      expect(screen.queryByTestId("modernTable-meter")).not.toBeInTheDocument()

      const utilization = columnCells(container, "valuedisk_util_utilization")
      expect(utilization.length).toBeGreaterThan(0)
      utilization.forEach(cell => {
        expect(within(cell).queryByTestId("modernTable-trend")).not.toBeInTheDocument()
        expect(within(cell).getByTestId("modernTable-bar")).toBeInTheDocument()
      })
    })

    it("marks the sorted header and sorts the rows", async () => {
      const chart = await makeTableChart("modern")
      chart.updateAttribute("tableSortBy", [{ id: "labelNode2", desc: true }])
      const { container } = renderWithChart(<TableChart />, { chart })
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 350))
      })

      const headers = screen.getAllByTestId("modernTable-header")
      const node = headers.find(el => el.textContent === "Node")
      expect(node).toHaveAttribute("data-sorted", "desc")
      headers.filter(el => el !== node).forEach(el => expect(el).not.toHaveAttribute("data-sorted"))

      const names = Array.from(getRows(container)).map(row => row.textContent)
      expect(names[0]).toContain("nd-child-unpaid07")
      expect(names[names.length - 1]).toContain("lab-cloud-unpaid")
    })

    it("keeps every column id and sorting function of the default flavour", async () => {
      const chart = await makeTableChart("default")
      const options = () => {
        const [rowGroups, contextGroups, labels] = chart.getTableMatrix()
        return {
          period: "window",
          groups: chart.getDimensionGroups(),
          dimensionIds: chart.getDimensionIds(),
          labels,
          rowGroups,
          contextGroups,
        }
      }
      const leaves = columns =>
        columns.flatMap(group =>
          group.columns.map(({ id, name, sortingFn, meta }) => ({
            group: group.id,
            id,
            name,
            sortable: typeof sortingFn === "function",
            tooltip: !!meta?.tooltip,
          }))
        )

      const { result: defaultResult } = renderHookWithChart(() => useTableColumns(options()), {
        chart,
      })
      const defaultColumns = leaves(defaultResult.current)

      chart.updateAttribute("designFlavour", "modern")
      const { result: modernResult } = renderHookWithChart(() => useTableColumns(options()), {
        chart,
      })

      const unitsMoveToGroupHeader = column =>
        column.id.startsWith("value") ? { ...column, tooltip: false } : column

      expect(leaves(modernResult.current)).toEqual(defaultColumns.map(unitsMoveToGroupHeader))
      expect(defaultColumns.some(column => column.id.startsWith("value") && column.tooltip)).toBe(
        true
      )
      expect(defaultColumns.length).toBeGreaterThan(2)
    })

    it("opens search inline in the header and drives the search query", async () => {
      const { container, chart, user } = await renderTable("modern")

      expect(within(container).queryByRole("textbox")).not.toBeInTheDocument()

      await user.click(screen.getByTestId("modernTable-searchToggle"))
      const input = within(screen.getByTestId("modernTableHeader")).getByRole("textbox")
      await user.type(input, "sda")
      await settle(700)

      expect(chart.getAttribute("searchQuery")).toBe("sda")
      expect(screen.getByTestId("modernTable-searchToggle")).toHaveAttribute("aria-pressed", "true")

      await user.click(screen.getByTestId("modernTable-searchToggle"))
      await settle()

      expect(chart.getAttribute("searchQuery")).toBe("")
      expect(within(container).queryByRole("textbox")).not.toBeInTheDocument()
    })

    it("keeps the search open while a query is set", async () => {
      const { container } = await renderTable("modern", { attributes: { searchQuery: "sda" } })

      expect(within(screen.getByTestId("modernTableHeader")).getByRole("textbox")).toHaveValue(
        "sda"
      )
      expect(within(container).getAllByRole("textbox")).toHaveLength(1)
    })
  })

  describe("row status", () => {
    it("reports the worst alert state of the row nodes", async () => {
      const chart = await makeTableChart("modern")
      const [first] = mgOf(chart)
      const nodes = chart.getAttribute("nodes")
      const key = Object.keys(nodes).find(k => nodes[k].mg === first)

      const id = chart.getDimensionIds().find(dimId => dimId.includes(first))
      expect(getRowStatus(chart, [id])).toBe("clear")

      chart.updateAttribute("nodes", { ...nodes, [key]: { ...nodes[key], al: { cl: 1, wr: 2 } } })
      expect(getRowStatus(chart, [id])).toBe("warning")

      chart.updateAttribute("nodes", {
        ...nodes,
        [key]: { ...nodes[key], al: { cl: 1, wr: 2, cr: 1 } },
      })
      expect(getRowStatus(chart, [id])).toBe("critical")
    })

    it("has no status when rows are not grouped by node or instance", async () => {
      const chart = await makeTableChart("modern")
      chart.updateAttribute("viewDimensions", {
        ...chart.getAttribute("viewDimensions"),
        grouped: ["dimension", "context"],
      })

      expect(getRowStatus(chart, ["reads,disk.io"])).toBeNull()
    })

    it("has no status when the node reports no alerts", async () => {
      const chart = await makeTableChart("modern")
      const nodes = chart.getAttribute("nodes")
      const stripped = Object.keys(nodes).reduce((h, key) => {
        h[key] = { ...nodes[key], al: undefined }
        return h
      }, {})
      chart.updateAttribute("nodes", stripped)

      expect(getRowStatus(chart, chart.getDimensionIds().slice(0, 3))).toBeNull()
    })
  })

  describe("helpers", () => {
    it("builds a trend from the payload", async () => {
      const chart = await makeTableChart("modern")
      const id = chart.getDimensionIds().find(dimId => dimId.startsWith("reads"))

      const trend = getTrend(chart, id)
      expect(trend.length).toBeGreaterThan(1)
      expect(trend.length).toBeLessThanOrEqual(40)
      expect(getTrend(chart, undefined)).toEqual([])
    })

    it("makes an svg path and skips gaps", () => {
      expect(makeTrendPath([1, 2, 3], 20, 10)).toMatch(/^M0\.0,.*L10\.0,.*L20\.0,/)
      expect(makeTrendPath([1, null, 3, 4], 30, 10)).toContain("M20.0")
      expect(makeTrendPath([1], 20, 10)).toBe("")
      expect(makeTrendPath([2, 2], 20, 10)).toBe("M0.0,5.0L20.0,5.0")
    })

    it("clamps meter values", () => {
      expect(clampPercent(140)).toBe(100)
      expect(clampPercent(-20)).toBe(20)
      expect(clampPercent(null)).toBe(0)
      expect(clampPercent("x")).toBe(0)
      expect(clampPercent(42.5)).toBe(42.5)
    })

    it("detects percentage units through their aliases", () => {
      expect(isPercentUnit("percentage")).toBe(true)
      expect(isPercentUnit("% of time working")).toBe(true)
      expect(isPercentUnit("KiB/s")).toBe(false)
      expect(isPercentUnit(undefined)).toBe(false)
    })
  })
})

describe("modern table keeps every value", () => {
  const readCells = container =>
    Array.from(getRows(container)).map(row =>
      Object.fromEntries(
        Array.from(row.querySelectorAll('[data-testid^="netdata-table-cell-"]')).map(cell => [
          cell.getAttribute("data-testid").replace("netdata-table-cell-", ""),
          {
            text: cell.textContent.trim(),
            missing: !!cell.querySelector('[data-testid="modernTable-missing"]'),
            merged: Array.from(
              cell.querySelectorAll('[data-testid="modernTable-mergedLabel"]')
            ).map(label => [label.getAttribute("data-column"), label.textContent.trim()]),
          },
        ])
      )
    )

  const expectSameValues = (expected, actual) => {
    expect(expected.length).toBeGreaterThan(0)
    expect(actual).toHaveLength(expected.length)

    expected.forEach((row, index) => {
      const modern = actual[index]
      const merged = Object.fromEntries(Object.values(modern).flatMap(cell => cell.merged))

      Object.keys(modern).forEach(column => expect(row).toHaveProperty([column]))

      Object.entries(row).forEach(([column, cell]) => {
        if (!(column in modern)) {
          expect(merged[column]).toBe(cell.text)
          return
        }

        const filled = !!modern[column].text && !modern[column].missing
        expect([column, filled]).toEqual([column, !!cell.text])
        if (modern[column].missing) expect(cell.text).toBe("")
      })
    })
  }

  it("shows a value in exactly the cells the default table fills", async () => {
    const defaultTable = await renderTable("default")
    const expected = readCells(defaultTable.container)
    defaultTable.unmount()

    const modernTable = await renderTable("modern")
    const actual = readCells(modernTable.container)

    expect(expected.flatMap(Object.values).filter(cell => cell.text).length).toBeGreaterThan(0)
    expect(actual.flatMap(Object.values).some(cell => cell.missing)).toBe(false)
    expectSameValues(expected, actual)
  })

  it("marks only the cells without a dimension with a dash", async () => {
    const defaultTable = await renderTable("default", { payload: missingPayload })
    const expected = readCells(defaultTable.container)
    defaultTable.unmount()

    const modernTable = await renderTable("modern", { payload: missingPayload })
    const actual = readCells(modernTable.container)
    const missing = actual.flatMap(Object.values).filter(cell => cell.missing)

    expect(missing).toHaveLength(1)
    expect(missing[0].text).toBe("–")
    expectSameValues(expected, actual)
  })
})

describe("modern table chrome", () => {
  const ConsumerElement = ({ disabled }) => (
    <button type="button" data-testid="consumerElement" disabled={disabled}>
      Add to dashboard
    </button>
  )

  it("shows the title, the scope summary and the alert status", async () => {
    const { chart } = await renderTable("modern")
    const header = screen.getByTestId("modernTableHeader")

    expect(within(header).getByTestId("chartHeaderStatus-title")).toHaveTextContent(
      chart.getAttribute("title")
    )
    expect(within(header).getByTestId("chartScope")).toBeInTheDocument()
    expect(within(header).getByTestId("modernTable-alerts")).toHaveAttribute("data-status", "clear")
    expect(within(header).queryByText(/\[.*\]/)).not.toBeInTheDocument()
  })

  it("moves the toolbox into the hover actions and the More menu", async () => {
    const { user } = await renderTable("modern", {
      attributes: { toolboxElements: [Settings, Fullscreen, ConsumerElement] },
    })

    expect(screen.queryByTestId("chartHeaderStatus")).not.toBeInTheDocument()
    expect(screen.queryByTestId("netdata-table-header-container")).not.toBeInTheDocument()
    expect(screen.queryByTestId("consumerElement")).not.toBeInTheDocument()
    expect(screen.queryByTestId("chartHeaderToolbox-settings")).not.toBeInTheDocument()

    const actions = screen.getByTestId("modernTable-actions")
    expect(within(actions).getByTestId("modernTable-searchToggle")).toBeInTheDocument()
    expect(within(actions).getByTestId("chartHeaderToolbox-fullscreen")).toBeInTheDocument()

    await user.click(screen.getByTestId("modernTable-more"))
    const menu = screen.getByTestId("modernTableMenu")

    expect(within(menu).getByTestId("consumerElement")).toBeInTheDocument()
    expect(within(menu).getByTestId("modernTableMenu-columns")).toBeInTheDocument()
    expect(within(menu).getByTestId("modernTableMenu-reload")).toBeInTheDocument()

    await user.click(within(menu).getByTestId("modernTableMenu-settings"))

    expect(screen.queryByTestId("modernTableMenu")).not.toBeInTheDocument()
    expect(screen.getByTestId("chartSettings")).toBeInTheDocument()
  })

  it("hides settings and fullscreen when the consumer leaves them out", async () => {
    const { user } = await renderTable("modern", { attributes: { toolboxElements: [] } })

    expect(screen.queryByTestId("chartHeaderToolbox-fullscreen")).not.toBeInTheDocument()

    await user.click(screen.getByTestId("modernTable-more"))

    expect(screen.getByTestId("modernTableMenu")).toBeInTheDocument()
    expect(screen.queryByTestId("modernTableMenu-settings")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTableMenu-elements")).not.toBeInTheDocument()
  })

  it("toggles columns from the More menu", async () => {
    const { container, user } = await renderTable("modern")

    expect(columnCells(container, "valuedisk_io_reads").length).toBeGreaterThan(0)

    await user.click(screen.getByTestId("modernTable-more"))
    await user.click(screen.getByTestId("modernTableMenu-columns"))
    const findReads = () =>
      screen
        .getAllByTestId("modernTableMenu-column")
        .find(item => item.getAttribute("data-column") === "valuedisk_io_reads")

    expect(findReads()).toHaveAttribute("aria-checked", "true")

    await user.click(findReads())
    await settle()

    expect(columnCells(container, "valuedisk_io_reads")).toHaveLength(0)
    expect(findReads()).toHaveAttribute("aria-checked", "false")
  })
})

describe("modern table cells", () => {
  it("shows the unit once in each group header and numbers only in the cells", async () => {
    await renderTable("modern")

    const units = screen.getAllByTestId("modernTable-groupUnit").map(el => el.textContent)
    expect(screen.getAllByTestId("modernTable-groupHeader")).toHaveLength(4)
    expect(units).toEqual(expect.arrayContaining(["KiB/s", "%"]))
    expect(new Set(units).size).toBe(units.length)

    screen
      .getAllByTestId("modernTable-value")
      .forEach(value => expect(value.textContent).toMatch(/^-?[\d.,]+$|^-$/))
  })

  it("renders a muted dash with an explanation where a row has no dimension", async () => {
    await renderTable("modern", { payload: missingPayload })
    const mark = screen.getByTestId("modernTable-missing")

    expect(mark).toHaveTextContent("–")
    expect(mark).toHaveAttribute("aria-label", missingValueText)
    expect(missingValueText).toBe("This device reports no value for this column")

    const cell = mark.closest('[data-testid^="netdata-table-cell-"]')
    expect(cell).toHaveAttribute("data-testid", "netdata-table-cell-valuedisk_await_writes")
    expect(cell.closest('[data-testid^="netdata-table-row"]').textContent).toContain("dm-0")
  })

  it("keeps cells of dimensions hidden by filters empty", async () => {
    const chart = await makeTableChart("modern")
    const hidden = chart.getDimensionIds().find(id => id.startsWith("reads,sda,"))
    chart.updateAttribute(
      "selectedLegendDimensions",
      chart.getDimensionIds().filter(id => id !== hidden)
    )
    const { container } = renderWithChart(<TableChart />, { chart })
    await settle()

    expect(screen.queryByTestId("modernTable-missing")).not.toBeInTheDocument()
    const empty = columnCells(container, "valuedisk_await_reads").filter(
      cell => !cell.textContent.trim()
    )
    expect(empty).toHaveLength(1)
  })

  it("keeps trends neutral and colours them only on the hovered row", async () => {
    await renderTable("modern")
    const trend = screen.getAllByTestId("modernTable-trend")[0]
    const holder = trend.parentElement
    const css = Array.from(document.querySelectorAll("style"))
      .map(style => style.textContent)
      .join("\n")

    expect(holder.style.getPropertyValue("--modern-trend-color")).toBe(
      trend.querySelector("path").getAttribute("stroke")
    )
    expect(css).toContain("--modern-trend-color")
    expect(css).toMatch(
      /netdata-table-row"\]:hover [^{]*path\s*\{\s*stroke:\s*var\(--modern-trend-color\)/
    )
  })

  it("scales the bars per column and warns on hot percentages", async () => {
    const hotPayload = withValue(tableFixture[0], hotId, 93.4)
    const { container } = await renderTable("modern", { payload: hotPayload })

    const columns = [
      "valuedisk_await_reads",
      "valuedisk_await_writes",
      "valuedisk_io_reads",
      "valuedisk_io_writes",
      "valuedisk_ops_reads",
      "valuedisk_ops_writes",
      "valuedisk_util_utilization",
    ]
    const peaks = columns.map(column => {
      const shares = columnCells(container, column).map(cell =>
        Number(within(cell).getByTestId("modernTable-bar").getAttribute("data-share"))
      )
      expect(shares.length).toBeGreaterThan(0)
      expect(shares.every(share => share >= 0 && share <= 1)).toBe(true)
      return Math.max(...shares)
    })
    peaks.forEach(peak => expect([0, 1]).toContain(peak))
    expect(peaks.filter(peak => peak === 1).length).toBeGreaterThan(1)

    const hot = columnCells(container, "valuedisk_util_utilization").filter(cell =>
      within(cell).getByTestId("modernTable-value").hasAttribute("data-hot")
    )
    expect(hot).toHaveLength(1)
    expect(within(hot[0]).getByTestId("modernTable-value")).toHaveTextContent("93.4")
    expect(within(hot[0]).getByTestId("modernTable-bar")).toHaveAttribute("data-share", "1")
  })
})

describe("modern table story payload", () => {
  it("has one missing cell, one hot percentage and raised row alerts", async () => {
    await renderTable("modern", { payload: makeTablePayload() })

    expect(screen.getAllByTestId("modernTable-missing")).toHaveLength(1)
    expect(
      screen.getAllByTestId("modernTable-value").filter(value => value.hasAttribute("data-hot"))
    ).toHaveLength(1)
    const statuses = screen.getAllByTestId("modernTable-status").map(dot => dot.dataset.status)
    expect(statuses).toEqual(expect.arrayContaining(["critical", "warning", "clear"]))
  })
})

describe("modern table merged labels", () => {
  it("shows the node under the instance name instead of its own column", async () => {
    const { container } = await renderTable("modern")
    const rows = getRows(container)

    expect(columnCells(container, "labelNode2")).toHaveLength(0)
    expect(screen.getAllByTestId("modernTable-mergedLabel")).toHaveLength(rows.length)
    expect(rows[0].textContent).toContain("lab-cloud-unpaid")
  })

  it("sorts by node from the merged header", async () => {
    const { container, user } = await renderTable("modern")

    const sortedHeader = () =>
      within(screen.getByTestId("modernTable-mergedSort")).getByTestId("modernTable-header")
    const names = () => Array.from(getRows(container)).map(row => row.textContent)

    expect(sortedHeader()).not.toHaveAttribute("data-sorted")

    await user.click(screen.getByTestId("modernTable-mergedSort"))
    await settle()

    expect(sortedHeader()).toHaveAttribute("data-sorted", "desc")
    expect(names()[0]).toContain("nd-child-unpaid07")
    expect(names()[names().length - 1]).toContain("lab-cloud-unpaid")
    screen
      .getAllByTestId("modernTable-header")
      .filter(header => header !== sortedHeader())
      .forEach(header => expect(header).not.toHaveAttribute("data-sorted"))

    await user.click(screen.getByTestId("modernTable-mergedSort"))
    await settle()

    expect(sortedHeader()).toHaveAttribute("data-sorted", "asc")
    expect(names()[0]).toContain("lab-cloud-unpaid")
  })

  it("splits the node back into its own column when it is shown", async () => {
    const { container, user } = await renderTable("modern")

    await user.click(screen.getByTestId("modernTable-more"))
    await user.click(screen.getByTestId("modernTableMenu-columns"))
    const node = screen
      .getAllByTestId("modernTableMenu-column")
      .find(item => item.getAttribute("data-column") === "labelNode2")
    expect(node).toHaveAttribute("aria-checked", "false")

    await user.click(node)
    await settle()

    expect(columnCells(container, "labelNode2")).toHaveLength(getRows(container).length)
    expect(screen.queryByTestId("modernTable-mergedLabel")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTable-mergedSort")).not.toBeInTheDocument()
  })
})

describe("default table chrome stays as it is", () => {
  it.each(["default", "minimal"])("keeps the %s search, status and toolbox", async flavour => {
    const { container } = await renderTable(flavour)

    expect(screen.getByTestId("netdata-table-header-container")).toBeInTheDocument()
    expect(within(container).getAllByRole("textbox").length).toBeGreaterThan(0)
    expect(screen.getByTestId("chartHeaderStatus")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox-settings")).toBeInTheDocument()
    expect(screen.getByTestId("chartHeaderToolbox-fullscreen")).toBeInTheDocument()
    expect(screen.getByTestId("bulk-actions")).toBeInTheDocument()
    expect(columnCells(container, "labelNode2")).toHaveLength(getRows(container).length)
    expect(screen.queryByTestId("modernTableHeader")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTable-bar")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTable-groupHeader")).not.toBeInTheDocument()
    expect(screen.queryByTestId("modernTable-mergedLabel")).not.toBeInTheDocument()
  })

  it("leaves cells without a dimension empty", async () => {
    const { container } = await renderTable("default", { payload: missingPayload })

    expect(screen.queryByTestId("modernTable-missing")).not.toBeInTheDocument()
    const empty = columnCells(container, "valuedisk_await_writes").filter(
      cell => !cell.textContent.trim()
    )
    expect(empty).toHaveLength(1)
  })
})

describe("modern table helpers", () => {
  it("measures the share of the column maximum", () => {
    expect(getShare(5, 10)).toBe(0.5)
    expect(getShare(-5, 10)).toBe(0.5)
    expect(getShare(20, 10)).toBe(1)
    expect(getShare(5, 0)).toBe(0)
    expect(getShare(null, 10)).toBe(0)
    expect(getShare(Number.NaN, 10)).toBe(0)
  })

  it("flags percentages at or above 80", () => {
    expect(isHotPercent(80)).toBe(true)
    expect(isHotPercent(93.4)).toBe(true)
    expect(isHotPercent(79.9)).toBe(false)
    expect(isHotPercent(null)).toBe(false)
  })

  it("measures a context once per rows, payload and hover", async () => {
    const chart = await makeTableChart("modern")
    const [rowGroups, contextGroups] = chart.getTableMatrix()
    const rows = Object.keys(rowGroups).map(key => ({ key, ids: rowGroups[key], contextGroups }))

    const scale = getContextScale(chart, rows, "disk.io")
    expect(Object.keys(scale.columns)).toEqual(["reads", "writes"])
    expect(scale.max).toBe(Math.max(scale.columns.reads, scale.columns.writes))
    expect(scale.sampleId).toMatch(/disk\.io$/)
    expect(getContextScale(chart, rows, "disk.io")).toBe(scale)
    expect(getContextScale(chart, undefined, "disk.io")).toEqual({
      columns: {},
      max: 0,
      sampleId: undefined,
    })
  })

  it("summarises the chart alerts for the status pill", () => {
    expect(getTableStatus({})).toBeNull()
    expect(getTableStatus({ a: { nm: "a", cl: 2 } })).toEqual({
      status: "clear",
      description: "1 alert watches this chart, none is raised",
    })
    expect(getTableStatus({ a: { nm: "a", wr: 1 }, b: { nm: "b", cr: 2 } })).toEqual({
      status: "critical",
      count: 2,
      names: ["b", "a"],
    })
    expect(getTableStatus({ a: { nm: "a", wr: 1 } })).toMatchObject({ status: "warning", count: 1 })
  })

  it("lists every leaf column for the column menu", () => {
    const columns = [
      {
        id: "Instance",
        columns: [
          { id: "labelA", name: "A" },
          { id: "labelB", name: "B" },
        ],
      },
      { id: "Context-x", headerString: () => "X", columns: [{ id: "valuex", name: "reads" }] },
    ]

    expect(getColumnOptions(columns)).toEqual([
      { id: "labelA", label: "A" },
      { id: "labelB", label: "B" },
      { id: "valuex", label: "X reads" },
    ])
    expect(getMergedLabelVisibility(columns)).toEqual({ labelB: false })
    expect(getMergedLabelVisibility([{ id: "Instance", columns: [{ id: "labelA" }] }])).toBe(
      undefined
    )
  })
})
