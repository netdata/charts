import React, { useEffect, useLayoutEffect, useRef, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Tooltip from "./tooltip"
import Legend from "./legend"
import Toolbox from "./toolbox"
import Header from "./header"
import Details from "./details"
import DimensionFilter from "./dimensionFilter"
import withIntersection from "./withIntersection"
import useHover from "./useHover"

const ChartContainer = styled.div`
  width: 100%;
`

export const Chart = ({ chart, ...rest }) => {
  const chartRef = useRef()
  const [detailsOpen, setDetailsOpen] = useState(false)

  const ref = useHover(chart)

  useLayoutEffect(() => {
    if (chart.getAttribute("loaded")) {
      chart.getUI().mount(chartRef.current)
      return
    }

    return chart.onceAttributeChange("loaded", () => chart.getUI().mount(chartRef.current))
  }, [])

  useEffect(() => () => chart.getUI().unmount(), [])

  return (
    <Flex
      ref={ref}
      round
      border={{ color: "borderSecondary", side: "all" }}
      column
      data-testid="chart"
      {...rest}
    >
      <Header
        chart={chart}
        detailsOpen={detailsOpen}
        toggleDetails={() => setDetailsOpen(s => !s)}
      />
      <Flex position="relative" column flex data-testid="chartContainer">
        <Flex position="relative" padding={[0, 0, 4, 0]} flex data-testid="chartContentWrapper">
          <ChartContainer data-testid="chartContent" ref={chartRef} />
          <Toolbox chart={chart} />
          <Tooltip chart={chart} />
        </Flex>
        <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend">
          <DimensionFilter chart={chart} />
          <Legend chart={chart} flex />
        </Flex>
        {detailsOpen && <Details chart={chart} />}
      </Flex>
    </Flex>
  )
}

export default withIntersection(Chart)
