import React, { useState } from "react"
import { act, screen, within } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart, renderHookWithChart } from "@jest/testUtilities"
import MoreMenu from "@/components/modern/header/moreMenu"
import TileMenu from "@/components/modern/tile/menu"
import TableMenu from "@/components/modern/table/menu"
import { useValueFocus } from "./focus"

const makeChart = attributes =>
  makeTestChart({ attributes: { designFlavour: "modern", ...attributes } }).chart

const DrillingMoreMenu = () => {
  const [drill, setDrill] = useState(null)
  const [returnTo, setReturnTo] = useState(null)

  return (
    <MoreMenu
      onClose={() => {}}
      onOpenTab={() => {}}
      drill={drill}
      returnTo={returnTo}
      onDrill={id => setDrill(id)}
      onBack={() => {
        setReturnTo(drill)
        setDrill(null)
      }}
    />
  )
}

const optionValues = container =>
  within(container)
    .getAllByRole("menuitemradio")
    .map(item => item.getAttribute("data-value"))

describe("useValueFocus", () => {
  it("resolves the chart's own type and follows the attribute", () => {
    const chart = makeChart()
    const { result } = renderHookWithChart(() => useValueFocus("number"), { chart })

    expect(result.current).toBe("trends")

    act(() => chart.updateAttribute("valueFocus", "totals"))
    expect(result.current).toBe("totals")
  })

  it("follows a live root default until the chart has its own focus", () => {
    const chart = makeChart()
    const { result } = renderHookWithChart(() => useValueFocus("gauge"), { chart })

    act(() => chart.getRoot().updateAttribute("valueFocusDefault", "totals"))
    expect(result.current).toBe("totals")
    expect(chart.getAttribute("valueFocus")).toBeNull()

    act(() => chart.updateAttribute("valueFocus", "changes"))
    act(() => chart.getRoot().updateAttribute("valueFocusDefault", "trends"))
    expect(result.current).toBe("changes")
  })

  it("is null where focus does not apply", () => {
    const chart = makeChart({ valueFocus: "totals" })
    const { result } = renderHookWithChart(() => useValueFocus("dygraph"), { chart })

    expect(result.current).toBeNull()
  })
})

describe("Focus in the More menu", () => {
  it("drills into the supported modes from the Show group", async () => {
    const chart = makeChart({ chartLibrary: "table" })
    const { user } = renderWithChart(<DrillingMoreMenu />, { chart })

    const item = within(screen.getByTestId("chartMore-group-show")).getByTestId(
      "chartMore-valueFocus"
    )
    expect(item).toHaveTextContent("Focus")
    expect(item).toHaveTextContent("Trends")

    await user.click(item)

    expect(screen.getByTestId("chartMore-back")).toHaveTextContent("← Focus")
    const panel = screen.getByTestId("chartMore-drilled")
    expect(optionValues(panel)).toEqual(["totals", "changes", "trends"])
    expect(within(panel).getByTestId("valueFocus-trends")).toHaveAttribute("aria-checked", "true")
    expect(within(panel).getByTestId("valueFocus-totals")).toHaveAttribute("aria-checked", "false")
    expect(within(panel).getByTestId("valueFocus-changes")).toHaveTextContent(
      "did anything just change?"
    )

    await user.click(within(panel).getByTestId("valueFocus-changes"))

    expect(chart.getAttribute("valueFocus")).toBe("changes")
    expect(screen.getByTestId("chartMore-valueFocus")).toHaveTextContent("Changes")
  })

  it("is reachable with the keyboard", async () => {
    const chart = makeChart({ chartLibrary: "gauge" })
    const { user } = renderWithChart(<DrillingMoreMenu />, { chart })

    screen.getByTestId("chartMore-valueFocus").focus()
    await user.keyboard("{Enter}")
    await user.keyboard("{ArrowDown}")
    expect(document.activeElement).toHaveAttribute("data-value", "totals")
    await user.keyboard("{Enter}")

    expect(chart.getAttribute("valueFocus")).toBe("totals")
  })

  it.each(["dygraph", "uplot", "bars"])("is not offered on %s", chartLibrary => {
    const chart = makeChart({ chartLibrary })
    renderWithChart(<DrillingMoreMenu />, { chart })

    expect(screen.queryByTestId("chartMore-valueFocus")).not.toBeInTheDocument()
  })
})

describe("Focus in the tile menu", () => {
  it("expands the supported modes and updates the attribute", async () => {
    const chart = makeChart({ chartLibrary: "number" })
    const { user } = renderWithChart(<TileMenu onClose={() => {}} onOpenSettings={() => {}} />, {
      chart,
    })

    const item = screen.getByTestId("valueFocus-toggle")
    expect(item).toHaveTextContent("Focus")
    expect(item).toHaveTextContent("Trends")
    expect(item).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByTestId("valueFocus-totals")).not.toBeInTheDocument()

    await user.click(item)

    expect(item).toHaveAttribute("aria-expanded", "true")
    expect(optionValues(screen.getByTestId("modernTileMenu"))).toEqual([
      "totals",
      "changes",
      "trends",
    ])

    await user.click(screen.getByTestId("valueFocus-totals"))

    expect(chart.getAttribute("valueFocus")).toBe("totals")
    expect(screen.getByTestId("valueFocus-totals")).toHaveAttribute("aria-checked", "true")
    expect(screen.getByTestId("valueFocus-toggle")).toHaveTextContent("Totals")
  })

  it("sits between Chart settings and Chart info", () => {
    const chart = makeChart({ chartLibrary: "gauge" })
    renderWithChart(<TileMenu onClose={() => {}} onOpenSettings={() => {}} />, { chart })

    const ids = Array.from(
      screen.getByTestId("modernTileMenu").querySelectorAll("[data-testid]")
    ).map(node => node.getAttribute("data-testid"))

    expect(ids.indexOf("modernTileMenu-settings")).toBeLessThan(ids.indexOf("valueFocus-toggle"))
    expect(ids.indexOf("valueFocus-toggle")).toBeLessThan(ids.indexOf("modernTileMenu-info"))
  })

  it("is not offered on charts without focus", () => {
    const chart = makeChart({ chartLibrary: "d3pie" })
    renderWithChart(<TileMenu onClose={() => {}} onOpenSettings={() => {}} />, { chart })

    expect(screen.queryByTestId("valueFocus-toggle")).not.toBeInTheDocument()
  })
})

describe("Focus in the table menu", () => {
  it("sits after Columns and updates the attribute", async () => {
    const chart = makeChart({ chartLibrary: "table" })
    const { user } = renderWithChart(
      <TableMenu
        columns={[{ id: "group", columns: [{ id: "a", name: "A" }] }]}
        columnVisibility={{}}
        onColumnVisibilityChange={() => {}}
        onClose={() => {}}
        onOpenSettings={() => {}}
      />,
      { chart }
    )

    const ids = Array.from(
      screen.getByTestId("modernTableMenu").querySelectorAll("[data-testid]")
    ).map(node => node.getAttribute("data-testid"))
    expect(ids.indexOf("modernTableMenu-columns")).toBeLessThan(ids.indexOf("valueFocus-toggle"))

    await user.click(screen.getByTestId("valueFocus-toggle"))
    await user.click(screen.getByTestId("valueFocus-changes"))

    expect(chart.getAttribute("valueFocus")).toBe("changes")
  })
})
