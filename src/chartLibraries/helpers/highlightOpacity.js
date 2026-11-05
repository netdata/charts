export const applyHighlightOpacity = (ctx, chart) => {
  const opacity = chart.getAttribute("highlightOpacity")
  if (Number.isFinite(opacity)) ctx.globalAlpha *= Math.max(0, Math.min(1, opacity))
}
