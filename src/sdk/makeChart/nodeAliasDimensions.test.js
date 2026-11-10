import React from "react"
import { act, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { makeTestChart, renderWithChart } from "@jest/testUtilities"
import { useLegendRows } from "@/components/modern/legend/useLegendRows"

const LegendNames = () => {
  const { rows } = useLegendRows()
  return rows.map(row => <span key={row.id}>{row.name}</span>)
}

const nodes = {
  "nd-1": { nd: "nd-1", nm: "host-1" },
  "nd-2": { nd: "nd-2", nm: "host-2" },
}

const aliases = {
  "nd-1": { name: "Zulu", labels: {} },
  "nd-2": { name: "Alpha", labels: {} },
}

const setup = ({ grouped, ids, names, nodesById, attributes = {} }) => {
  const { chart } = makeTestChart({
    attributes: {
      nodes,
      nodesById,
      viewDimensions: { ids, names, grouped, priorities: ids.map(() => 0), units: ["x"] },
      ...attributes,
    },
  })
  chart.updateDimensions()
  return chart
}

const byNode = {
  grouped: ["node"],
  ids: ["nd-1", "nd-2"],
  names: ["host-1", "host-2"],
}

describe("node alias in dimension names", () => {
  it("shows the alias when grouped by node", () => {
    const chart = setup({ ...byNode, nodesById: aliases })

    expect(chart.getDimensionName("nd-1")).toBe("Zulu")
    expect(chart.getRawDimensionName("nd-1")).toBe("host-1")
  })

  it("shows the alias in the node part of a node,dimension group", () => {
    const chart = setup({
      grouped: ["node", "dimension"],
      ids: ["nd-1,user", "nd-2,system"],
      names: ["host-1,user", "host-2,system"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("nd-1,user")).toBe("Zulu,user")
    expect(chart.getDimensionName("nd-1,user", 0)).toBe("Zulu")
    expect(chart.getDimensionName("nd-1,user", 1)).toBe("user")
  })

  it("shows the alias in the node part when node is not first", () => {
    const chart = setup({
      grouped: ["dimension", "node"],
      ids: ["user,nd-1"],
      names: ["user,host-1"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("user,nd-1")).toBe("user,Zulu")
    expect(chart.getDimensionName("user,nd-1", 1)).toBe("Zulu")
  })

  it("replaces the @host suffix of an instance name with the alias", () => {
    const chart = setup({
      grouped: ["instance"],
      ids: ["cpu0@nd-1"],
      names: ["cpu0@host-1"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("cpu0@nd-1")).toBe("cpu0@Zulu")
    expect(chart.getRawDimensionName("cpu0@nd-1")).toBe("cpu0@host-1")
  })

  it("keeps an instance name whose suffix is not the node raw name", () => {
    const chart = setup({
      grouped: ["instance"],
      ids: ["cpu0@nd-1"],
      names: ["cpu0@other"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("cpu0@nd-1")).toBe("cpu0@other")
  })

  it("aliases instance parts inside a multi-part group", () => {
    const chart = setup({
      grouped: ["instance", "dimension"],
      ids: ["cpu0@nd-1,user"],
      names: ["cpu0@host-1,user"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("cpu0@nd-1,user")).toBe("cpu0@Zulu,user")
    expect(chart.getDimensionName("cpu0@nd-1,user", 0)).toBe("cpu0@Zulu")
  })

  it("is identical to the raw name when nodesById or the entry is absent", () => {
    const withoutAttribute = setup(byNode)
    const withoutEntry = setup({ ...byNode, nodesById: { "nd-1": { labels: {} } } })

    expect(withoutAttribute.getDimensionName("nd-1")).toBe("host-1")
    expect(withoutEntry.getDimensionName("nd-1")).toBe("host-1")
    expect(withoutEntry.getDimensionName("nd-2")).toBe("host-2")
  })

  it("leaves dimension-grouped names untouched", () => {
    const chart = setup({
      grouped: ["dimension"],
      ids: ["user"],
      names: ["user"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("user")).toBe("user")
  })

  it("still matches a saved raw name in selectedLegendDimensions", () => {
    const chart = setup({
      ...byNode,
      nodesById: aliases,
      attributes: { selectedLegendDimensions: ["host-2"] },
    })

    expect(chart.getVisibleDimensionIds()).toEqual(["nd-2"])
  })

  it("sorts by the displayed alias", () => {
    const aliased = setup({
      ...byNode,
      nodesById: aliases,
      attributes: { dimensionsSort: "nameAsc" },
    })
    const raw = setup({ ...byNode, attributes: { dimensionsSort: "nameAsc" } })

    expect(aliased.getDimensionIds()).toEqual(["nd-2", "nd-1"])
    expect(raw.getDimensionIds()).toEqual(["nd-1", "nd-2"])
  })

  it("updates a rendered legend when nodesById changes, without fetching", async () => {
    const chart = setup(byNode)
    const fetch = jest.fn()
    chart.on("fetch", fetch)
    renderWithChart(<LegendNames />, { chart })
    expect(screen.getByText("host-1")).toBeInTheDocument()

    act(() => chart.updateAttribute("nodesById", aliases))

    expect(screen.getByText("Zulu")).toBeInTheDocument()
    expect(screen.queryByText("host-1")).not.toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it("re-sorts when nodesById changes", () => {
    const chart = setup({ ...byNode, attributes: { dimensionsSort: "nameAsc" } })
    expect(chart.getDimensionIds()).toEqual(["nd-1", "nd-2"])

    chart.updateAttribute("nodesById", aliases)

    expect(chart.getDimensionIds()).toEqual(["nd-2", "nd-1"])
  })

  it("does not emit dimensionChanged for a new nodesById object without alias changes", () => {
    const chart = setup({ ...byNode, nodesById: { "nd-1": { labels: { a: 1 } } } })
    const changed = jest.fn()
    chart.on("dimensionChanged", changed)

    chart.updateAttribute("nodesById", { "nd-1": { labels: { a: 2 } } })
    expect(changed).not.toHaveBeenCalled()

    chart.updateAttribute("nodesById", { "nd-1": { name: "Zulu", labels: {} } })
    expect(changed).toHaveBeenCalledTimes(1)

    chart.updateAttribute("nodesById", { "nd-1": { name: "Zulu", labels: { b: 1 } } })
    expect(changed).toHaveBeenCalledTimes(1)

    chart.updateAttribute("nodesById", { "nd-1": { name: "Other", labels: {} } })
    expect(changed).toHaveBeenCalledTimes(2)
  })

  it("does not match a selectedLegendDimensions entry equal to the alias", () => {
    const chart = setup({
      ...byNode,
      nodesById: aliases,
      attributes: { selectedLegendDimensions: ["Alpha"] },
    })

    expect(chart.getVisibleDimensionIds()).toEqual([])
  })

  it("keeps a raw name containing a comma", () => {
    const chart = setup({
      grouped: ["node"],
      ids: ["nd-1"],
      names: ["host,1"],
      nodesById: aliases,
    })

    expect(chart.getDimensionName("nd-1")).toBe("host,1")
  })

  it("gives nodes sharing a hostname their own aliases", () => {
    const chart = setup({
      grouped: ["instance"],
      ids: ["cpu0@nd-1", "cpu0@nd-2"],
      names: ["cpu0@shared", "cpu0@shared"],
      nodesById: aliases,
      attributes: { nodes: { "nd-1": { nm: "shared" }, "nd-2": { nm: "shared" } } },
    })

    expect(chart.getDimensionName("cpu0@nd-1")).toBe("cpu0@Zulu")
    expect(chart.getDimensionName("cpu0@nd-2")).toBe("cpu0@Alpha")
  })

  describe("dimension ids built from the machine guid", () => {
    const claimedNodes = {
      "nd-1": { mg: "mg-1", nd: "nd-1", nm: "host-1" },
      "nd-2": { mg: "mg-2", nd: "nd-2", nm: "host-2" },
    }

    it("aliases a node group when nodesById is keyed by the node id", () => {
      const chart = setup({
        grouped: ["node"],
        ids: ["mg-1", "mg-2"],
        names: ["host-1", "host-2"],
        nodesById: aliases,
        attributes: { nodes: claimedNodes },
      })

      expect(chart.getDimensionName("mg-1")).toBe("Zulu")
      expect(chart.getDimensionName("mg-2")).toBe("Alpha")
      expect(chart.getRawDimensionName("mg-1")).toBe("host-1")
    })

    it("aliases the @host suffix of an instance name", () => {
      const chart = setup({
        grouped: ["instance", "dimension"],
        ids: ["cpu0@mg-1,user"],
        names: ["cpu0@host-1,user"],
        nodesById: aliases,
        attributes: { nodes: claimedNodes },
      })

      expect(chart.getDimensionName("cpu0@mg-1,user")).toBe("cpu0@Zulu,user")
      expect(chart.getDimensionName("cpu0@mg-1,user", 0)).toBe("cpu0@Zulu")
    })

    it("aliases when nodesById is keyed by the machine guid as well", () => {
      const chart = setup({
        grouped: ["node"],
        ids: ["mg-1"],
        names: ["host-1"],
        nodesById: { "mg-1": { name: "Zulu", labels: {} } },
        attributes: { nodes: { "mg-1": { mg: "mg-1", nm: "host-1" } } },
      })

      expect(chart.getDimensionName("mg-1")).toBe("Zulu")
    })

    it("keeps the raw names when no alias is set", () => {
      const chart = setup({
        grouped: ["instance"],
        ids: ["cpu0@mg-1"],
        names: ["cpu0@host-1"],
        nodesById: { "nd-1": { labels: {} } },
        attributes: { nodes: claimedNodes },
      })

      expect(chart.getDimensionName("cpu0@mg-1")).toBe("cpu0@host-1")
    })
  })
})
