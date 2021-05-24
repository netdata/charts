import makeSDK from "./index"

it("add charts", () => {
  const sdk = makeSDK({ defaultUI: "myChartLibrary", ui: { myChartLibrary: () => {} } })
  expect(sdk.getNodes()).toEqual([sdk.getRoot()])

  const charts = [sdk.makeChart(), sdk.makeChart(), sdk.makeChart()]

  charts.forEach(chart => sdk.appendChild(chart))

  expect(sdk.getNodes()).toEqual([sdk.getRoot(), ...charts])
  expect(charts[0].getParent()).toBe(sdk.getRoot())
})

it("add charts in containers", () => {
  const sdk = makeSDK({ defaultUI: "myChartLibrary", ui: { myChartLibrary: () => {} } })

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
