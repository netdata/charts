import { act } from "@testing-library/react"
import { makeTestChart } from "@jest/testUtilities"
import { getDrillFilters, applyDrillFilter } from "./filters"

const nodes = { n1: { mg: "mg-1", nd: "n1", nm: "web-1" } }

describe("group boxes filters", () => {
  it("offers one filter per label level and the node level", () => {
    expect(getDrillFilters("mon,mg-1,p1", ["label:ns", "node", "label:pod"], nodes)).toEqual([
      { kind: "label", selector: "ns:mon", label: "Filter to ns = mon" },
      { kind: "node", selector: "n1", label: "Filter to node web-1" },
      { kind: "label", selector: "pod:p1", label: "Filter to pod = p1" },
    ])
  })

  it("skips unset values, unknown nodes and other level kinds", () => {
    expect(getDrillFilters("user,[unset],mg-9", ["dimension", "label:ns", "node"], nodes)).toEqual(
      []
    )
  })

  it("offers nothing when a value has a comma", () => {
    expect(getDrillFilters("mon,a,b", ["label:ns", "label:pod"], nodes)).toEqual([])
  })

  it("filters to the value, replacing other values of the same key and keeping other keys", async () => {
    const { chart } = makeTestChart({ attributes: { selectedLabels: ["env:prod", "ns:infra"] } })

    await act(async () => {
      applyDrillFilter(chart, { kind: "label", selector: "ns:mon" })
    })

    expect(chart.getAttribute("selectedLabels")).toEqual(["env:prod", "ns:mon"])
  })

  it("narrows to the value when it is already selected with others", async () => {
    const { chart } = makeTestChart({ attributes: { selectedLabels: ["ns:mon", "ns:infra"] } })

    await act(async () => {
      applyDrillFilter(chart, { kind: "label", selector: "ns:mon" })
    })

    expect(chart.getAttribute("selectedLabels")).toEqual(["ns:mon"])
  })

  it("filters to one node and keeps only its instances", async () => {
    const { chart } = makeTestChart({
      attributes: { selectedNodes: ["n0"], selectedInstances: ["cpu@n0", "cpu@n1"] },
    })

    await act(async () => {
      applyDrillFilter(chart, { kind: "node", selector: "n1" })
    })

    expect(chart.getAttribute("selectedNodes")).toEqual(["n1"])
    expect(chart.getAttribute("selectedInstances")).toEqual(["cpu@n1"])
  })
})
