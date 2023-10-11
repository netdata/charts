import React, { memo } from "react"
import styled from "styled-components"
import resizeHandler from "@netdata/netdata-ui/dist/components/icon/assets/resize_handler.svg"
import { useChart } from "@/components/provider"
import Icon from "@/components/icon"

const Drag = styled(Icon).attrs({
  color: "textLite",
  hoverColor: "textDescription",
  svg: resizeHandler,
  size: "16px",
  alignSelf: "end",
})`
  cursor: ns-resize;
`

const onDoubleClick = event => {
  event.preventDefault()
  event.stopPropagation()
}

const Resize = props => {
  const chart = useChart()

  const onDragStart = event => {
    event.preventDefault()
    chart.trigger("resizeYStart")
    const eventStartHeight = event.type === "touchstart" ? event.touches[0].clientY : event.clientY

    const setHeight = currentHeight => {
      const diff = currentHeight - eventStartHeight
      chart.trigger("resizeYMove", diff)
    }

    const onMouseMove = e => setHeight(e.clientY)
    const onTouchMove = e => setHeight(e.touches[0].clientY)

    const onMouseEnd = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseEnd)
      chart.trigger("resizeYEnd")
    }

    const onTouchEnd = () => {
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", onTouchEnd)
      chart.trigger("resizeYEnd")
    }

    if (event.type === "touchstart") {
      document.addEventListener("touchmove", onTouchMove)
      document.addEventListener("touchend", onTouchEnd)
    } else {
      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseEnd)
    }
  }

  return (
    <Drag
      onDoubleClick={onDoubleClick}
      onMouseDown={onDragStart}
      onTouchStart={onDragStart}
      alignSelf="end"
      margin={[0, 0, 0, 1]}
      {...props}
    />
  )
}

export default memo(Resize)
