import makeSDK from "./index"

it("add charts", () => {
  const sdk = makeSDK({
    attributes: { chartLibrary: "myChartLibrary" },
    ui: { myChartLibrary: () => {} },
  })
  expect(sdk.getNodes()).toEqual([sdk.getRoot()])

  const charts = [sdk.makeChart(), sdk.makeChart(), sdk.makeChart()]

  charts.forEach(chart => sdk.appendChild(chart))

  expect(sdk.getNodes()).toEqual([sdk.getRoot(), ...charts])
  expect(charts[0].getParent()).toBe(sdk.getRoot())
})

it("add charts in containers", () => {
  const sdk = makeSDK({
    attributes: { chartLibrary: "myChartLibrary" },
    ui: { myChartLibrary: () => {} },
  })

  const container1 = sdk.makeContainer("group1")
  sdk.appendChild(container1)

  const container2 = sdk.makeContainer("group2")
  sdk.appendChild(container2)

  const chart1 = sdk.makeChart()
  container1.appendChild(chart1)

  const group2 = [sdk.makeChart(), sdk.makeChart()]
  group2.forEach(chart => container2.appendChild(chart))

  expect(chart1.getParent()).toBe(container1)
  expect(container1.getParent()).toBe(sdk.getRoot())

  expect(group2[0].getParent()).toBe(container2)
  expect(container2.getParent()).toBe(sdk.getRoot())

  expect(sdk.getNodes()).toEqual([sdk.getRoot(), container1, chart1, container2, ...group2])
})

it("lets a chart inherit valueFocus from its container and override it", () => {
  const sdk = makeSDK({
    attributes: { chartLibrary: "myChartLibrary" },
    ui: { myChartLibrary: () => {} },
  })
  const container = sdk.makeContainer({ attributes: { valueFocus: "totals" } })
  sdk.appendChild(container)

  const following = sdk.makeChart()
  container.appendChild(following)
  const overriding = sdk.makeChart({ attributes: { valueFocus: "changes" } })
  container.appendChild(overriding)
  const loose = sdk.makeChart()
  sdk.appendChild(loose)

  expect(following.getAttribute("valueFocus")).toBe("totals")
  expect(overriding.getAttribute("valueFocus")).toBe("changes")
  expect(loose.getAttribute("valueFocus")).toBeNull()
})

it("tracks a valueFocus change as unsaved", () => {
  const sdk = makeSDK({
    attributes: { chartLibrary: "myChartLibrary" },
    ui: { myChartLibrary: () => {} },
  })
  const chart = sdk.makeChart()
  sdk.appendChild(chart)

  chart.updateAttribute("valueFocus", "totals")

  expect(chart.getAttribute("pristine")).toHaveProperty("valueFocus", null)
})

describe("valueFocusDefault", () => {
  const makeTree = () => {
    const sdk = makeSDK({
      attributes: { chartLibrary: "myChartLibrary" },
      ui: { myChartLibrary: () => {} },
    })
    const container = sdk.makeContainer()
    sdk.appendChild(container)
    const following = sdk.makeChart()
    container.appendChild(following)
    const own = sdk.makeChart({ attributes: { valueFocus: "changes" } })
    container.appendChild(own)
    return { sdk, container, following, own }
  }

  it("is null on the root by default", () => {
    const { sdk } = makeTree()
    expect(sdk.getRoot().getAttribute("valueFocusDefault")).toBeNull()
  })

  it("reaches every descendant when the root changes it live", () => {
    const { sdk, container, following, own } = makeTree()
    const changes = []
    following.onAttributeChange("valueFocusDefault", value => changes.push(value))

    sdk.getRoot().updateAttribute("valueFocusDefault", "totals")

    expect(container.getAttribute("valueFocusDefault")).toBe("totals")
    expect(following.getAttribute("valueFocusDefault")).toBe("totals")
    expect(own.getAttribute("valueFocusDefault")).toBe("totals")
    expect(changes).toEqual(["totals"])
    expect(following.getAttribute("valueFocus")).toBeNull()
    expect(own.getAttribute("valueFocus")).toBe("changes")
  })

  it("keeps a container's own default when the root changes", () => {
    const { sdk, container, following } = makeTree()
    container.updateAttribute("valueFocusDefault", "trends")

    sdk.getRoot().updateAttribute("valueFocusDefault", "totals")

    expect(container.getAttribute("valueFocusDefault")).toBe("trends")
    expect(following.getAttribute("valueFocusDefault")).toBe("trends")
  })

  it("is inherited by charts added later", () => {
    const { sdk, container } = makeTree()
    sdk.getRoot().updateAttribute("valueFocusDefault", "totals")

    const late = sdk.makeChart()
    container.appendChild(late)

    expect(late.getAttribute("valueFocusDefault")).toBe("totals")
  })

  it("is not tracked as an unsaved chart change", () => {
    const { sdk, following } = makeTree()

    sdk.getRoot().updateAttribute("valueFocusDefault", "totals")

    expect(following.getAttribute("pristine")).not.toHaveProperty("valueFocusDefault")
  })
})
