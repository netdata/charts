import { unregister } from "@/helpers/makeListeners"

export default ({
  chart,
  makeResources,
  makeColors,
  makeFrame,
  makeDrawStats,
  watchedAttributes = [],
  makeExtraListeners = () => [],
  getMinMax,
}) => {
  let resource = null
  let listeners = null
  let colors = null
  let previousRange = null
  let drawStats = null

  const updateColors = () => {
    colors = makeColors(chart)
  }

  const mount = ({ render }) => {
    updateColors()
    const { loaded } = chart.getAttributes()
    listeners = unregister(
      chart.onAttributeChange("hoverX", render),
      !loaded && chart.onceAttributeChange("loaded", render),
      ...watchedAttributes.map(attribute =>
        chart.onAttributeChange(attribute, render)
      ),
      ...makeExtraListeners({ chart, render }),
      chart.onAttributeChange("theme", () => {
        updateColors()
        render()
      })
    )
  }

  const unmount = () => {
    listeners?.()
    listeners = null
    resource?.destroy()
    resource = null
    colors = null
    previousRange = null
    drawStats = null
  }

  const render = frame => {
    if (!resource || !chart.getAttribute("loaded")) return false
    const nextFrame = makeFrame({ chart, frame: { ...frame, colors } })
    if (nextFrame === false) return false
    if (nextFrame === true) return true

    const { min, max } = nextFrame
    if (!previousRange || min !== previousRange[0] || max !== previousRange[1])
      chart.trigger("yAxisChange", min, max)
    previousRange = [min, max]

    resource.layer.update(nextFrame)
    resource.surface.draw([resource.layer], frame)
    drawStats = makeDrawStats(nextFrame)
    return true
  }

  return {
    mount,
    unmount,
    render,
    createResources: (runtime, canvas) => makeResources(runtime, canvas),
    attachResources: nextResource => {
      resource?.destroy()
      resource = nextResource
    },
    getBufferBytes: () => resource?.layer.getBufferBytes() || 0,
    getDrawStats: () => drawStats,
    getQueueDone: () => resource?.surface.getQueueDone?.() || Promise.resolve(),
    ...(getMinMax && { getMinMax: () => getMinMax(chart) }),
  }
}
