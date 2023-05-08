import makeSDK from "@/sdk"
import makeDygraph from "./index"

it("renders a chart", () => {
  const sdk = makeSDK({
    defaultUI: "dygraph",
    ui: { dygraph: makeDygraph },
    attributes: { after: 1617946860000, before: 1617947750000 },
  })
  const chart = sdk.makeChart()
  sdk.appendChild(chart)

  chart.doneFetch({
    result: {
      labels: ["time", "label1", "label2", "label3"],
      data: [
        [1617946860000, 1, 2, 3],
        [1617947750000, 2, 1, 3],
      ],
    },
  })

  const element = document.createElement("div")
  chart.getUI("default").mount(element)
  expect(element.querySelectorAll("canvas")).toHaveLength(2)
})
