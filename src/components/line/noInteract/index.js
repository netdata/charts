import React from "react"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart } from "@/components/provider"
import FilterToolbox from "@/components/filterToolbox"
import Footer from "@/components/line/footer"
import Container from "@/components/container"
import { ContentWrapper } from "@/components/line/chartContentWrapper"
import ChartContentWrapper from "./chartContentWrapper"

export const NoInteractLine = props => {
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
    <Container ref={ref} {...props}>
      <FilterToolbox />
      <ContentWrapper>
        <ChartContentWrapper />
      </ContentWrapper>
      <Footer />
    </Container>
  )
}

export default withChart(NoInteractLine)
