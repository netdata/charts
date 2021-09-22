import React, { memo } from "react"
import styled from "styled-components"
import resizeHandler from "@netdata/netdata-ui/lib/components/icon/assets/resize_handler.svg"
import { useChart } from "@/components/provider"
import Icon from "@/components/icon"

const Drag = styled(Icon).attrs({
  color: "textLite",
  hoverColor: "textDescription",
  svg: resizeHandler,
  size: "16px",
})`
  cursor: ns-resize;
`

const onDoubleClick = event => {
  event.preventDefault()
  event.stopPropagation()
}

const Resize = props => {
  const chart = useChart()

  const onDragStart = () => {
    event.preventDefault()
    // const intialHeight = chartContainerElement.clientHeight
    chart.trigger("resizeYStart")
    const eventStartHeight = event.type === "touchstart" ? event.touches[0].clientY : event.clientY

    const setHeight = currentHeight => {
      const diff = currentHeight - eventStartHeight
      chart.trigger("resizeYMove", diff)
      //   const nextHeight = intialHeight + currentHeight - eventStartHeight
      //   // eslint-disable-next-line no-param-reassign
      //   chartContainerElement.style.height = `${nextHeight.toString()}px`
      //   setResizeHeight(nextHeight)
      //   if (heightId) {
      //     const heightForPersistance = isLegendOnBottom
      //       ? nextHeight - LEGEND_BOTTOM_SINGLE_LINE_HEIGHT
      //       : nextHeight
      //     localStorage.setItem(
      //       `${LOCALSTORAGE_HEIGHT_KEY_PREFIX}${heightId}`,
      //       `${heightForPersistance}`
      //     )
      //   }
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
