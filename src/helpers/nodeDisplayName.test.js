import { makeTestChart } from "@jest/testUtilities"
import { getNodeDisplayName } from "./nodeDisplayName"

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
})
