import React, { useLayoutEffect, useRef } from "react"
import styled from "styled-components"
import { useChart } from "@/components/provider"

const Container = styled.div`
  height: 100% !important;
  width: 100% !important;
`

const ChartContainer = props => {
  const chart = useChart()
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI() && chart.getUI().unmount()
  }, [])

  return <Container data-testid="chartContent" ref={ref} {...props} />
}

export default ChartContainer
