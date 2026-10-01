const fallbackScale = ["#C9DCF7", "#6A9EE6", "#2358B0"]

export const getScale = chart => {
  const scale = chart.getThemeAttribute("themeGroupBoxesScale")
  return Array.isArray(scale) && scale.length ? scale : fallbackScale
}

export const getThreshold = chart => {
  const threshold = chart.getAttribute("groupBoxesThreshold")
  return typeof threshold === "number" && Number.isFinite(threshold) ? threshold : null
}

export const getThresholdColor = chart => chart.getThemeAttribute("themeErrorBackground")

export const pickStep = (value, min, max, steps) => {
  if (steps < 1) return 0
  const number = Number(value)
  if (!Number.isFinite(number) || !(max > min)) return 0

  const ratio = Math.min(1, Math.max(0, (number - min) / (max - min)))
  return Math.min(steps - 1, Math.floor(ratio * steps))
}

export const makeModernColor = chart => (min, max) => {
  const scale = getScale(chart)
  const threshold = getThreshold(chart)
  const thresholdColor = getThresholdColor(chart)

  return value =>
    threshold !== null && typeof value === "number" && value >= threshold
      ? thresholdColor
      : scale[pickStep(value, min, max, scale.length)]
}

export const modernBoxOptions = chart => ({
  cellSize: 20,
  cellPadding: 3,
  radius: 3,
  lineWidth: 2,
  cellStroke: 2,
  makeColor: makeModernColor(chart),
  getActiveStroke: () => chart.getThemeAttribute("themeLabelColor"),
})
