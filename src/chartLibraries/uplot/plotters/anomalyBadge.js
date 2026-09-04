const badgePath =
  "M13.228 3.29597L8.522 0.578973C8.167 0.373973 7.771 0.271973 7.375 0.271973C6.979 0.271973 6.583 0.373973 6.228 0.578973L1.522 3.29597C0.812 3.70597 0.375 4.46297 0.375 5.28297V10.718C0.375 11.537 0.812 12.295 1.522 12.704L6.228 15.421C6.583 15.626 6.979 15.728 7.375 15.728C7.771 15.728 8.167 15.626 8.522 15.421L13.228 12.704C13.938 12.294 14.375 11.537 14.375 10.718V5.28297C14.375 4.46297 13.938 3.70597 13.228 3.29597ZM7.97949 4.76094L7.37505 3.23265L6.7706 4.76094L4.93313 9.40688H4.37505H1.37505V10.7069H4.37505H5.37505H5.81696L5.97949 10.2959L7.37505 6.76735L8.7706 10.2959L9.26618 11.549L9.93839 10.3811L10.375 9.62253L10.8117 10.3811L10.9992 10.7069H11.375H13.375V9.40688H11.7509L10.9384 7.99531L10.375 7.01662L9.8117 7.99531L9.48391 8.56479L7.97949 4.76094Z"

const badgeWidth = 15
const badgeHeight = 16
const badgeScale = 0.6
const badgeGap = 4
const badgeColor = "#B596F8"
const badgeAlpha = 0.4

let path = null

const getPath = () => {
  if (path) return path
  if (typeof Path2D === "undefined") return null

  path = new Path2D(badgePath)
  return path
}

export default chartUI => self => {
  const { chart } = chartUI

  if (!chart.getAttribute("showAnomalies")) return
  if (chart.getAttribute("enabledYAxis") === false) return
  if (chart.isSparkline()) return
  if (chart.getAttribute("chartType") === "heatmap") return

  const shape = getPath()
  if (!shape) return

  const dpr = self.pxRatio || 1
  const scale = badgeScale * dpr
  const width = badgeWidth * scale
  const left = self.bbox.left - width - badgeGap * dpr

  if (left < 0) return

  const { ctx } = self

  ctx.save()
  ctx.translate(left, self.bbox.top)
  ctx.scale(scale, scale)
  ctx.globalAlpha = badgeAlpha
  ctx.fillStyle = badgeColor
  ctx.fill(shape, "evenodd")
  ctx.restore()
}

export const badgeSize = { width: badgeWidth, height: badgeHeight, scale: badgeScale }
