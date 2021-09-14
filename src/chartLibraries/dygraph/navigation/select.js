import Dygraph from "dygraphs"
import { dragGetX_ } from "dygraphs/src/dygraph-utils"

export default chartUI => {
  let startX
  let endX

  const mousedown = (event, g, context) => {
    chartUI.sdk.trigger("highlightStart", chartUI.chart)
    context.initializeMouseDown(event, g, context)
    Dygraph.startZoom(event, g, context)
    startX = context.dragStartX
    endX = -1
  }

  const mousemove = (event, g, context) => {
    if (!context.isZooming) return

    const { canvas_ctx_: ctx, canvas_: canvas } = g
    const area = g.getArea()
    const rect = canvas.getBoundingClientRect()
    const areaRect = {
      left: rect.left + area.x,
      top: rect.top + area.y,
      width: area.w,
      height: area.h,
    }

    if (event.pageX < areaRect.left || event.pageX > areaRect.left + areaRect.width) return

    context.zoomMoved = true
    context.dragEndX = dragGetX_(event, context)

    const { dragStartX, dragEndX } = context

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "rgba(128,128,128,0.3)"
    ctx.fillRect(Math.min(dragStartX, dragEndX), area.y, Math.abs(dragEndX - dragStartX), area.h)

    context.prevEndX = dragEndX
    endX = dragEndX
  }

  const getRange = g => {
    if (endX === -1 || Math.abs(startX - endX) < 5) return null

    const after = Math.round(g.toDataXCoord(startX) / 1000)
    const before = Math.round(g.toDataXCoord(endX) / 1000)

    return [after, before].sort((a, b) => a - b)
  }

  const mouseup = (event, g, context) => {
    g.clearZoomRect_()
    context.isZooming = false
    context.dragStartX = null

    const range = getRange(g)

    chartUI.sdk.trigger("highlightEnd", chartUI.chart, range)
  }

  return chartUI
    .on("mousedown", mousedown)
    .on("mousemove", mousemove)
    .on("mouseup", mouseup)
    .on("mouseout", mouseup)
}
