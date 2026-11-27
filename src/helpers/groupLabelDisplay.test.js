import { getGroupLabelDisplay } from "./groupLabelDisplay"

const display = { interface: ["if_alias"] }

const viewDimensions = aliases => ({
  grouped: ["label:interface"],
  labels: { if_alias: aliases },
})

describe("getGroupLabelDisplay", () => {
  it("returns the preferred label value", () => {
    expect(getGroupLabelDisplay(display, viewDimensions([["Uplink to core"]]), 0, 0)).toBe(
      "Uplink to core"
    )
  })

  it.each([["[none]"], ["[unset]"], [""], ["  "]])(
    "treats %p as missing so the group value is shown",
    value => {
      expect(getGroupLabelDisplay(display, viewDimensions([[value]]), 0, 0)).toBeNull()
    }
  )

  it("skips placeholders among the instances of a group", () => {
    expect(getGroupLabelDisplay(display, viewDimensions([["[none]", "Uplink"]]), 0, 0)).toBe(
      "Uplink"
    )
  })

  it("tries the preferred labels in order", () => {
    const dims = {
      grouped: ["label:interface"],
      labels: { if_alias: [["[none]"]], if_descr: [["Port 24"]] },
    }

    expect(getGroupLabelDisplay({ interface: ["if_alias", "if_descr"] }, dims, 0, 0)).toBe(
      "Port 24"
    )
  })

  it("returns null when the grouping is not a configured label", () => {
    expect(getGroupLabelDisplay(display, { grouped: ["node"] }, 0, 0)).toBeNull()
    expect(getGroupLabelDisplay({}, viewDimensions([["Uplink"]]), 0, 0)).toBeNull()
    expect(getGroupLabelDisplay(undefined, viewDimensions([["Uplink"]]), 0, 0)).toBeNull()
  })

  it("returns null when the label values are missing", () => {
    expect(getGroupLabelDisplay(display, { grouped: ["label:interface"] }, 0, 0)).toBeNull()
  })
})
