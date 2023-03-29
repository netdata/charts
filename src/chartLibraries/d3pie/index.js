import makeChartUI from "@/sdk/makeChartUI"
import { unregister } from "@/helpers/makeListeners"
import makeResizeObserver from "@/helpers/makeResizeObserver"
import d3pie from "./library"
import getInitialOptions from "./getInitialOptions"

export default (sdk, chart) => {
  const chartUI = makeChartUI(sdk, chart)
  let pie = null
  let listeners
  let resizeObserver

  const reMake = () => {
    pie.destroy()
    pie.recreate()
  }

  const mount = element => {
    if (pie) return

    chartUI.mount(element)

    const theme = chart.getAttribute("theme")
    element.classList.add(theme)

    const { loaded } = chart.getAttributes()

    pie = new d3pie(element, getInitialOptions(chartUI))

    resizeObserver = makeResizeObserver(element.parentNode, () => {
      pie.options = {
        ...pie.options,
        size: getInitialOptions(chartUI).size,
      }
      reMake()
      chartUI.trigger("resize")
    })

    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      chart.onAttributeChange("theme", reMake)
    )

    render()
  }

  const render = () => {
    chartUI.render()

    const { hoverX, loaded } = chart.getAttributes()

    if (!pie || !loaded) return

    const { data } = chart.getPayload()

    if (data?.length === undefined) return

    let index = hoverX ? chart.getClosestRow(hoverX[0]) : -1
    index = index === -1 ? data.length - 1 : index

    const dimensionIds = chart.getVisibleDimensionIds()

    const values = dimensionIds
      .map(id => ({
        label: id,
        value: chart.getDimensionValue(id, index),
        color: chart.selectDimensionColor(id),
      }))
      .filter(v => !!v.value)

    chartUI.render()

    pie.options.data.content = values
    reMake()

    chartUI.trigger("rendered")
  }

  const unmount = () => {
    if (listeners) listeners()
    if (resizeObserver) resizeObserver()

    if (pie) {
      pie.destroy()
      pie = null
    }

    chartUI.unmount()
  }

  return {
    ...chartUI,
    mount,
    unmount,
    render,
  }
}
