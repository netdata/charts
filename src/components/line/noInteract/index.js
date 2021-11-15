import React from "react"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import FilterToolbox from "@/components/line/filterToolbox"
import Footer from "@/components/line/footer"
import Container from "@/components/line/container"
import { ContentWrapper } from "@/components/line/chartContentWrapper"
import ChartContentWrapper from "./chartContentWrapper"

export const NoInteractLine = props => {
  const chart = useChart()
  const composite = useAttributeValue("composite")

  const ref = useHover(
    {
      onHover: chart.focus,
      onBlur: chart.blur,
      isOut: node => !node || !node.closest("[data-toolbox]"),
    },
    [chart]
  )

  return (
    <Container ref={ref} {...props}>
      {composite && <FilterToolbox />}
      <ContentWrapper>
        <ChartContentWrapper />
      </ContentWrapper>
      <Footer />
    </Container>
  )
}

export default withChart(NoInteractLine)
