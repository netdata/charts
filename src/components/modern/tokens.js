// Shared by every component rendered under designFlavour "modern"; colours come from the
// netdata-ui theme (text, textLite, textDescription, border, mainChartBg, warning, error, success)
// and the chart's [light, dark] theme attributes on canvas.
export const numeralsFont = "'IBM Plex Sans Condensed', 'IBM Plex Sans', system-ui, sans-serif"

export const tabularNumbers = "font-variant-numeric: tabular-nums;"

export const radius = { card: "12px", control: "6px", pill: "999px" }

export const pickLegend = ({ width, count }) => {
  if (width < 420) return "hidden"
  if (width >= 900 || count > 6) return "table"
  if (count <= 4) return "direct"
  return "below"
}
