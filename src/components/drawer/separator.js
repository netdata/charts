import React, { useRef } from "react"
import styled from "styled-components"
import { Flex, getColor } from "@netdata/netdata-ui"
import { useChart, useAttributeValue } from "@/components/provider"

const ResizableBar = styled(Flex).attrs({ padding: [3, 0], height: 2 })`
  cursor: row-resize;
  background: transparent;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    right: 0;
    height: 2px;
    width: 30%;
    background: ${({ theme }) => getColor("borderSecondary")({ theme })};
    transform: translate(-50%, -50%);
    transition: height 0.2s ease;
  }

  &:hover::before {
    height: 4px;
    background: ${({ theme }) => getColor("primary")({ theme })};
  }
`

const Separator = () => {
  const chart = useChart()
  const expandedHeight = useAttributeValue("expandedHeight")
  const currentHeight = parseInt(chart.getAttribute("height") || "400")
  const startYRef = useRef(null)

  const handleMouseDown = e => {
    e.preventDefault()
    startYRef.current = e.clientY

    const handleMouseMove = e => {
      const delta = e.clientY - startYRef.current

      const minDrawerHeight = 150
      const maxDrawerHeight = 600
      const minChartHeight = 200

      const newDrawerHeight = Math.max(
        minDrawerHeight,
        Math.min(maxDrawerHeight, expandedHeight - delta)
      )
      const newChartHeight = Math.max(minChartHeight, currentHeight + delta)

      chart.updateAttribute("expandedHeight", newDrawerHeight)
      chart.updateAttribute("height", newChartHeight)
      chart.trigger("resize")
    }

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      startYRef.current = null
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "row-resize"
  }

  return <ResizableBar onMouseDown={handleMouseDown} />
}

export default Separator
