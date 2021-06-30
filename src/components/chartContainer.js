import React, { useLayoutEffect, useRef } from "react"
import styled from "styled-components"

const Container = styled.div`
  width: 100%;
  height: 100%;
`

const ChartContainer = ({ chart }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  }, [])

  return <Container data-testid="chartContent" ref={ref} />
}

export default ChartContainer
