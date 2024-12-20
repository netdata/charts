import { withoutPrefix } from "@/helpers/heatmap"

export default (a, b, pixels, opts, dygraph, vals, { labels: defaultLabels } = {}) => {
  const labels = defaultLabels.map(withoutPrefix)

  const pixelsPerTick = opts("pixelsPerLabel")
  const maxTicks = Math.floor(pixels / pixelsPerTick)

  const formatLabel = opts("axisLabelFormatter")

  const hiddenStep = Math.ceil(defaultLabels.length / (maxTicks - 1))
  const ticks = labels.map((l, i) => ({
    v: i,
    label: i % hiddenStep === 0 ? formatLabel(labels[i], 0, opts, dygraph) : null,
  }))

  const [min, max] = dygraph.yAxisRange(0)
  const pointHeight = (max - min) / 15 / dygraph.getArea().h

  return [{ label_v: max - pointHeight }, ...ticks, { label_v: min + pointHeight }]
}
