import makeChartUI from "@/sdk/makeChartUI"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)

  const mount = element => {
    chartUI.mount(element)
  }

  const unmount = () => {
    chartUI.unmount()
  }

  return { mount, unmount }
}
