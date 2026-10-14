export const isModern = chart => chart.getAttribute("designFlavour") === "modern"

const statusThemeKeys = {
  warning: "themeAlertWarning",
  critical: "themeAlertCritical",
  clear: "themeAlertClear",
}

export const getStatusColor = (chart, status) => {
  const key = statusThemeKeys[String(status || "").toLowerCase()]
  return key ? chart.getThemeAttribute(key) : null
}

export const labelFont = "500 10.5px 'IBM Plex Sans', system-ui, sans-serif"

export const roundedRectPath = (ctx, x, y, width, height, radius) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.arcTo(x + width, y, x + width, y + r, r)
  ctx.lineTo(x + width, y + height - r)
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r)
  ctx.lineTo(x + r, y + height)
  ctx.arcTo(x, y + height, x, y + height - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

export const crisp = value => Math.round(value) + 0.5
