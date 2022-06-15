import React from "react"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import Header from "./header"
import Details from "./details"
import ChartContentWrapper, { ContentWrapper } from "./chartContentWrapper"
import FilterToolbox from "./filterToolbox"
import Footer from "./footer"
import Container from "./container"

export const Line = props => {
  const chart = useChart()
  const composite = useAttributeValue("composite")
  const detailed = useAttributeValue("detailed")

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
      <Header />
      {composite && <FilterToolbox />}
      <ContentWrapper>
        <ChartContentWrapper />
        {detailed && <Details />}
      </ContentWrapper>
      {!detailed && <Footer />}
    </Container>
  )
}

export default withChart(Line)
