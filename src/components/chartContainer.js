import React, { useLayoutEffect, useRef } from "react"
import styled from "styled-components"
import { useChart } from "@/components/provider"

const Container = styled.div`
  width: 100%;
  height: 100%;
`

const ChartContainer = props => {
  const chart = useChart()
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  }, [])

  return <Container style={{ height: "100%" }} data-testid="chartContent" ref={ref} {...props} />
}

export default ChartContainer
