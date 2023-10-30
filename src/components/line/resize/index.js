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
  cursor: ${props => props.cursor};
`

const onDoubleClick = event => {
  event.preventDefault()
  event.stopPropagation()
}

const Resize = props => {
  const chart = useChart()

  const onDragStart = event => {
    event.preventDefault()
    chart.trigger("resizeStart")
    const eventStartHeight = event.type === "touchstart" ? event.touches[0].clientY : event.clientY
    const eventStartWidth = event.type === "touchstart" ? event.touches[0].clientX : event.clientX

    const setResize = (currentHeight, currentWidth) => {
      const diffY = currentHeight - eventStartHeight
      const diffX = currentWidth - eventStartWidth

      chart.trigger("resizeMove", diffY, diffX)
    }

    const onMouseMove = e => setResize(e.clientY, e.clientX)
    const onTouchMove = e => setResize(e.touches[0].clientY, e.touches[0].clientX)

    const onMouseEnd = () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseEnd)
      chart.trigger("resizeEnd")
    }

    const onTouchEnd = () => {
      document.removeEventListener("touchmove", onTouchMove)
      document.removeEventListener("touchend", onTouchEnd)
      chart.trigger("resizeEnd")
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
      {...props}
    />
  )
}

export default memo(Resize)
