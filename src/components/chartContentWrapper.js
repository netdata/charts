import React, { useState } from "react"
import styled, { css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty } from "@/components/useAttribute"
import Tooltip from "./tooltip"
import Toolbox from "./toolbox"
import useHover from "./useHover"
import ChartContainer from "./chartContainer"
import SkeletonChart from "./skeletonChart"
import { CenterNoData, HorizontalNoData } from "./noData"
import dygraphStyle from "@/chartLibraries/dygraph/style.css"

const chartLibraries = {
  dygraph: css`
    ${dygraphStyle}
  `,
}

const Container = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

const ChartContentWrapper = ({ chart }) => {
  const [focused, setFocused] = useState(false)
  const ref = useHover({ onHover: () => setFocused(true), onBlur: () => setFocused(false) })
  const initialLoading = useInitialLoading(chart)
  const empty = useEmpty(chart)

  const chartLibrary = chart.getAttribute("chartLibrary")

  return (
    <Container
      ref={ref}
      chartLibrary={chartLibrary}
      position="relative"
      padding={[0, 0, 4, 0]}
      flex
      data-testid="chartContentWrapper"
    >
      {!initialLoading && !empty && <ChartContainer chart={chart} />}
      {!initialLoading && !empty && <HorizontalNoData chart={chart} />}
      {!initialLoading && empty && <CenterNoData chart={chart} />}
      {initialLoading && <SkeletonChart />}
      {focused && !empty && <Toolbox chart={chart} />}
      <Tooltip chart={chart} />
    </Container>
  )
}

export default ChartContentWrapper
