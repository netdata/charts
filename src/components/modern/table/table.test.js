import React from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { renderWithChart, renderHookWithChart, makeTestChart } from "@jest/testUtilities"
import { TableChart } from "@/components/table"
import useTableColumns from "@/components/table/useTableColumns"
import tableFixture from "../../../../fixtures/table"
import { getRowStatus } from "./status"
import { getTrend, makeTrendPath } from "./trend"
import { clampPercent } from "./meter"
import { isPercentUnit } from "./columns"

const makeTableChart = async (designFlavour = "default") => {
  const { chart } = makeTestChart({
    mockData: tableFixture[0],
    attributes: {
      contextScope: ["disk.io", "disk.ops", "disk.await", "disk.util"],
      chartLibrary: "table",
      tableColumns: ["context", "dimension"],
      designFlavour,
    },
  })

  await act(async () => {
    await chart.fetch()
    await new Promise(resolve => setTimeout(resolve, 0))
  })

  return chart
}

const renderTable = async designFlavour => {
  const chart = await makeTableChart(designFlavour)
  const result = renderWithChart(<TableChart />, { chart })

  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 350))
  })

  return { ...result, chart }
}

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

    it("draws meters in percentage cells and trends in the others", async () => {
      await renderTable("modern")

      expect(screen.getAllByTestId("modernTable-meter").length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("modernTable-trend").length).toBeGreaterThan(0)
      expect(screen.getAllByTestId("modernTable-value").length).toBeGreaterThan(0)
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

      expect(leaves(modernResult.current)).toEqual(defaultColumns)
      expect(defaultColumns.length).toBeGreaterThan(2)
    })

    it("keeps search and column visibility controls", async () => {
      const { container } = await renderTable("modern")

      expect(within(container).getAllByRole("textbox").length).toBeGreaterThan(0)
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
