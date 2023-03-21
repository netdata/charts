import React from "react"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart } from "@/components/provider"
import Container from "@/components/container"
import ChartContentWrapper from "./chartContentWrapper"

export const Sparkline = props => {
  const chart = useChart()

  const ref = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node =>
        !node || (!node.closest("[data-toolbox]") && !node.closest("[data-testid=chart]")),
    },
    [chart]
  )

  return (
    <Container ref={ref} border={false} overflow="hidden" round={1} {...props}>
      <ChartContentWrapper />
    </Container>
  )
}

export default withChart(Sparkline)
