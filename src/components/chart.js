import React, { forwardRef, useCallback, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "./legend"
import Header from "./header"
import Details from "./details"
import DimensionFilter from "./dimensionFilter"
import useHover from "./useHover"
import ChartContentWrapper from "./chartContentWrapper"
import { useChart, useAttributeValue } from "./provider"
import FilterToolbox from "./filterToolbox"
import withChart from "./withChart"

export const Container = forwardRef((props, ref) => (
  <Flex
    ref={ref}
    data-testid="chart"
    border={{ color: "borderSecondary", side: "all" }}
    column
    round
    {...props}
  />
))

export const Footer = props => (
  <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend" {...props} />
)

export const ContentWrapper = props => (
  <Flex position="relative" column flex data-testid="chartContainer" {...props} />
)

export const Chart = props => {
  const chart = useChart()
  const composite = useAttributeValue("composite")
  const [detailsOpen, setDetailsOpen] = useState(false)
  const ref = useHover({ onHover: chart.focus, onBlur: chart.blur })

  const toggleDetails = useCallback(() => setDetailsOpen(s => !s), [])

  return (
    <Container ref={ref} {...props}>
      <Header detailsOpen={detailsOpen} toggleDetails={toggleDetails} />
      {composite && <FilterToolbox />}
      <ContentWrapper>
        <ChartContentWrapper />
        {detailsOpen && <Details />}
      </ContentWrapper>
      {!detailsOpen && (
        <Footer>
          <DimensionFilter />
          <Legend />
        </Footer>
      )}
    </Container>
  )
}

export default withChart(Chart)
