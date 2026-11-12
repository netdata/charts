import { makeTestChart } from "@jest/testUtilities"
import { getNodeDisplayName, getNodeRawName } from "./nodeDisplayName"

describe("getNodeDisplayName", () => {
  it("returns the alias from nodesById", () => {
    const { chart } = makeTestChart({
      attributes: { nodesById: { "nd-1": { name: "Alias", labels: {} } } },
    })

    expect(getNodeDisplayName(chart, "nd-1", "host-1")).toBe("Alias")
  })

  it("falls back when the attribute, entry or name is absent", () => {
    const { chart } = makeTestChart()
    expect(getNodeDisplayName(chart, "nd-1", "host-1")).toBe("host-1")

    chart.updateAttribute("nodesById", { "nd-2": { name: "Other" }, "nd-1": { labels: {} } })
    expect(getNodeDisplayName(chart, "nd-1", "host-1")).toBe("host-1")
    expect(getNodeDisplayName(chart, "nd-3", "host-3")).toBe("host-3")
  })

  it("resolves the alias from the machine guid when nodesById is keyed by the node id", () => {
    const { chart } = makeTestChart({
      attributes: {
        nodes: { "nd-1": { mg: "mg-1", nd: "nd-1", nm: "host-1" } },
        nodesById: { "nd-1": { name: "Alias", labels: {} } },
      },
    })

    expect(getNodeDisplayName(chart, "mg-1", "host-1")).toBe("Alias")
    expect(getNodeDisplayName(chart, "nd-1", "host-1")).toBe("Alias")
    expect(getNodeDisplayName(chart, "mg-2", "host-2")).toBe("host-2")
  })

  it("returns the raw node name for either id", () => {
    const { chart } = makeTestChart({
      attributes: { nodes: { "nd-1": { mg: "mg-1", nd: "nd-1", nm: "host-1" } } },
    })

    expect(getNodeRawName(chart, "mg-1")).toBe("host-1")
    expect(getNodeRawName(chart, "nd-1")).toBe("host-1")
    expect(getNodeRawName(chart, "other")).toBeUndefined()
  })

  it("follows a replaced nodes attribute", () => {
    const { chart } = makeTestChart({
      attributes: {
        nodes: { "nd-1": { mg: "mg-1", nd: "nd-1", nm: "host-1" } },
        nodesById: { "nd-1": { name: "Alias" }, "nd-2": { name: "Second" } },
      },
    })
    expect(getNodeDisplayName(chart, "mg-2", "host-2")).toBe("host-2")

    chart.updateAttribute("nodes", { "nd-2": { mg: "mg-2", nd: "nd-2", nm: "host-2" } })

    expect(getNodeDisplayName(chart, "mg-2", "host-2")).toBe("Second")
  })
})
