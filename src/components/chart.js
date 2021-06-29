import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading } from "@/components/useAttribute"
import skeletonChart from "@/components/icon/assets/skeleton_chart.svg"
import Tooltip from "./tooltip"
import Legend from "./legend"
import Toolbox from "./toolbox"
import Header from "./header"
import Details from "./details"
import DimensionFilter from "./dimensionFilter"
import withIntersection from "./withIntersection"
import withFullscreen from "./withFullscreen"
import useHover from "./useHover"
import Icon from "@/components/icon"

const ChartContainer2 = styled.div`
  width: 100%;
`

const ChartContainer = ({ chart }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  }, [])

  return <ChartContainer2 style={{ height: "100%" }} data-testid="chartContent" ref={ref} />
}

export const Chart = ({ chart, ...rest }) => {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const initialLoading = useInitialLoading(chart)
  const ref = useHover(chart)

  return (
    <Flex
      ref={ref}
      data-testid="chart"
      round={true}
      border={{ color: "borderSecondary", side: "all" }}
      column={true}
      {...rest}
    >
      <Header
        chart={chart}
        detailsOpen={detailsOpen}
        toggleDetails={() => setDetailsOpen(s => !s)}
      />
      <Flex position="relative" column flex data-testid="chartContainer">
        <Flex position="relative" padding={[0, 0, 4, 0]} flex data-testid="chartContentWrapper">
          {!initialLoading && <ChartContainer chart={chart} />}
          {initialLoading && (
            <Flex flex padding={[0, 0, 0, 10]}>
              <Icon svg={skeletonChart} width="100%" height="90%" />
            </Flex>
          )}
          <Toolbox chart={chart} />
          <Tooltip chart={chart} />
        </Flex>
        {detailsOpen && <Details chart={chart} />}
      </Flex>
      <Flex border={{ side: "top", color: "borderSecondary" }} data-testid="chartLegend">
        <DimensionFilter chart={chart} />
        <Legend chart={chart} flex />
      </Flex>
    </Flex>
  )
}

export default withFullscreen(withIntersection(Chart))
