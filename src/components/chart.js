import React, { useCallback, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Legend from "./legend"
import Header from "./header"
import Details from "./details"
import DimensionFilter from "./dimensionFilter"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import useHover from "./useHover"
import ChartContentWrapper from "./chartContentWrapper"

export const Chart = ({ chart, ...rest }) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const ref = useHover({ onHover: chart.focus, onBlur: chart.blur })

  const toggleDetails = useCallback(() => setDetailsOpen(s => !s), [])

  return (
    <Flex
      ref={ref}
      data-testid="chart"
      border={{ color: "borderSecondary", side: "all" }}
      column
      round
      {...rest}
    >
      <Header chart={chart} detailsOpen={detailsOpen} toggleDetails={toggleDetails} />
      <Flex position="relative" column flex data-testid="chartContainer">
        <ChartContentWrapper chart={chart} />
        {detailsOpen && <Details chart={chart} />}
      </Flex>
      <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend">
        <DimensionFilter chart={chart} />
        <Legend chart={chart} flex />
      </Flex>
    </Flex>
  )
}

const ChartWithIntersection = withIntersection(Chart)

const ChartWithFullscreen = withFullscreen(ChartWithIntersection)

export default ChartWithFullscreen
