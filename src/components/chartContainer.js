import React, { useLayoutEffect, useRef } from "react"
import styled from "styled-components"
import { useChart, useAttributeValue } from "@/components/provider"

const cursorByNavigation = {
  default: "default",
  selectVertical: "row-resize",
  select: "col-resize",
  highlight: "crosshair",
}

const activeCursorByNavigation = {
  ...cursorByNavigation,
  pan: "grabbing",
}

const Container = styled.div`
  height: auto !important;
  width: 100% !important;
  cursor: ${props => cursorByNavigation[props.navigation] || cursorByNavigation.default};

  ${props => {
    const activeCursor = activeCursorByNavigation[props.navigation]
    if (!activeCursor) return ""
    return `
      &:active {
        cursor: ${activeCursor};
      }
    `
  }}
  &:active {
    cursor: ${props => activeCursorByNavigation[props.navigation] || cursorByNavigation.default};
  }
`

const ChartContainer = props => {
  const chart = useChart()
  const ref = useRef()
  const navigation = useAttributeValue("navigation")

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  }, [])

  return <Container data-testid="chartContent" ref={ref} navigation={navigation} {...props} />
}

export default ChartContainer
