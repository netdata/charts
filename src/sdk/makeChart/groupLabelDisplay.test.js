import { makeTestChart } from "@jest/testUtilities"

const setup = ({ aliases, groupByLabelDisplay = { interface: ["if_alias"] } }) => {
  const ids = ["ae3.0", "et-1/0/0"]
  const { chart } = makeTestChart({
    attributes: {
      groupByLabelDisplay,
      viewDimensions: {
        ids,
        names: ids,
        grouped: ["label:interface"],
        labels: { if_alias: aliases },
        priorities: ids.map(() => 0),
        units: ["bits/s"],
      },
    },
  })
  chart.updateDimensions()
  return chart
}

describe("grouped label display", () => {
  it("shows the alias and falls back to the interface name when the alias is empty", () => {
    const chart = setup({ aliases: [["[none]"], ["Uplink to core"]] })

    expect(chart.getDimensionName("ae3.0", 0)).toBe("ae3.0")
    expect(chart.getDimensionName("et-1/0/0", 0)).toBe("Uplink to core")
  })

  it("falls back to the interface name when the alias is unset", () => {
    const chart = setup({ aliases: [["[unset]"], [""]] })

    expect(chart.getDimensionName("ae3.0", 0)).toBe("ae3.0")
    expect(chart.getDimensionName("et-1/0/0", 0)).toBe("et-1/0/0")
  })

  it("keeps the raw name for filtering and search", () => {
    const chart = setup({ aliases: [["Uplink"], ["Core"]] })

    expect(chart.getRawDimensionName("ae3.0", 0)).toBe("ae3.0")
  })

  it("shows the group value when no display label is configured", () => {
    const chart = setup({ aliases: [["Uplink"], ["Core"]], groupByLabelDisplay: {} })

    expect(chart.getDimensionName("ae3.0", 0)).toBe("ae3.0")
  })
})
