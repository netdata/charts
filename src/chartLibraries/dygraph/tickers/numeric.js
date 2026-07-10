import { isDurationAxis, makeAxisTicks } from "@/helpers/ticks"

const anomalySVG = `<div title="Anomaly detection percent (%)"><svg width="15" height="16" view-box="0 0 15 16" xmlns="http://www.w3.org/2000/svg" fill="#B596F8" fill-opacity="0.4" transform="translate(18, -1) scale(0.6)">
<path fill-rule="evenodd" clip-rule="evenodd" d="M13.228 3.29597L8.522 0.578973C8.167 0.373973 7.771 0.271973 7.375 0.271973C6.979 0.271973 6.583 0.373973 6.228 0.578973L1.522 3.29597C0.812 3.70597 0.375 4.46297 0.375 5.28297V10.718C0.375 11.537 0.812 12.295 1.522 12.704L6.228 15.421C6.583 15.626 6.979 15.728 7.375 15.728C7.771 15.728 8.167 15.626 8.522 15.421L13.228 12.704C13.938 12.294 14.375 11.537 14.375 10.718V5.28297C14.375 4.46297 13.938 3.70597 13.228 3.29597ZM7.97949 4.76094L7.37505 3.23265L6.7706 4.76094L4.93313 9.40688H4.37505H1.37505V10.7069H4.37505H5.37505H5.81696L5.97949 10.2959L7.37505 6.76735L8.7706 10.2959L9.26618 11.549L9.93839 10.3811L10.375 9.62253L10.8117 10.3811L10.9992 10.7069H11.375H13.375V9.40688H11.7509L10.9384 7.99531L10.375 7.01662L9.8117 7.99531L9.48391 8.56479L7.97949 4.76094Z" />
</svg></div>`

const getTickGranularity = (ticks, index) => {
  const value = ticks[index].v
  const previous = ticks[index - 1]?.v
  const next = ticks[index + 1]?.v
  const previousStep = typeof previous === "number" ? Math.abs(value - previous) : Infinity
  const nextStep = typeof next === "number" ? Math.abs(next - value) : Infinity
  const step = Math.min(previousStep, nextStep)

  return isFinite(step) ? step : 0
}

export default (a, b, pixels, opts, dygraph, vals, { secondsAsTime, units } = {}) => {
  const pixelsPerTick = opts("pixelsPerLabel")
  let ticks = []
  let i
  const forcedTicks = Boolean(vals)

  if (vals) {
    for (i = 0; i < vals.length; i++) {
      ticks.push({ v: vals[i] })
    }
  } else {
    if (ticks.length === 0) {
      ticks = makeAxisTicks({
        min: a,
        max: b,
        pixels,
        pixelsPerTick,
        units,
        secondsAsTime,
      })
    }
  }

  const formatLabel = opts("axisLabelFormatter")
  const durationAxis = isDurationAxis({ secondsAsTime, units })

  // Add labels to the ticks.
  for (i = 0; i < ticks.length; i++) {
    if (ticks[i].label !== undefined) continue // Use current label.
    if (durationAxis && ticks[i].v === 0) {
      ticks[i].label = "0"
      continue
    }
    ticks[i].label = formatLabel(
      ticks[i].v,
      forcedTicks ? 0 : getTickGranularity(ticks, i),
      opts,
      dygraph
    )
  }
  const [min, max] = dygraph.yAxisRange(0)
  const pointHeight = (max - min) / 15 / dygraph.getArea().h

  return [
    { label_v: max - pointHeight, label: anomalySVG },
    ...ticks,
    { label_v: min + pointHeight, label: "" },
  ]
}
