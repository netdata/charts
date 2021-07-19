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
import { withChartProvider, useChart, useAttributeValue } from "./provider"
import FilterToolbox from "./filterToolbox"

export const Chart = props => {
  const chart = useChart()
  const composite = useAttributeValue("composite")
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
      {...props}
    >
      <Header detailsOpen={detailsOpen} toggleDetails={toggleDetails} />
      {composite && <FilterToolbox />}
      <Flex position="relative" column flex data-testid="chartContainer">
        <ChartContentWrapper />
        {detailsOpen && <Details />}
      </Flex>
      {!detailsOpen && (
        <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend">
          <DimensionFilter />
          <Legend flex />
        </Flex>
      )}
    </Flex>
  )
}

const ChartWithIntersection = withIntersection(Chart)

const ChartWithFullscreen = withFullscreen(ChartWithIntersection)

const ChartWithProvider = withChartProvider(ChartWithFullscreen)

export default ChartWithProvider
