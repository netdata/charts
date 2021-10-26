import React from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import useHover from "@/components/useHover"
import withChart from "@/components/hocs/withChart"
import { useChart, useAttributeValue } from "@/components/provider"
import Header from "./header"
import Details from "./details"
import ChartContentWrapper from "./chartContentWrapper"
import FilterToolbox from "./filterToolbox"
import Footer from "./footer"

export const Container = styled(Flex).attrs(props => ({
  "data-testid": "chart",
  border: { color: "borderSecondary", side: "all" },
  column: true,
  round: true,
  ...props,
}))`
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  ::selection {
    background: transparent;
  }
  ::-moz-selection {
    background: transparent;
  }
`

export const ContentWrapper = props => (
  <Flex position="relative" column flex overflow="hidden" data-testid="contentWrapper" {...props} />
)

export const Line = props => {
  const chart = useChart()
  const composite = useAttributeValue("composite")
  const detailed = useAttributeValue("detailed")

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
