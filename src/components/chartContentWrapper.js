import React, { forwardRef, useState } from "react"
import styled, { css } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useInitialLoading, useEmpty, useAttributeValue } from "@/components/provider"
import Tooltip from "./tooltip"
import Toolbox from "./toolbox"
import useHover from "./useHover"
import ChartContainer from "./chartContainer"
import SkeletonChart from "./skeletonChart"
import { CenterNoData, HorizontalNoData } from "./noData"
import Highlight from "./highlight"
import dygraphStyle from "@/chartLibraries/dygraph/style.css"

const chartLibraries = {
  dygraph: css`
    ${dygraphStyle}
  `,
}

const StyledContainer = styled(Flex)`
  ${({ chartLibrary }) => chartLibraries[chartLibrary] || ""}
`

const Container = forwardRef((props, ref) => {
  const chartLibrary = useAttributeValue("chartLibrary")

  return (
    <StyledContainer
      ref={ref}
      chartLibrary={chartLibrary}
      position="relative"
      padding={[0, 0, 2]}
      flex
      data-testid="chartContentWrapper"
      {...props}
    />
  )
})

const ChartContentWrapper = () => {
  const [focused, setFocused] = useState(false)
  const ref = useHover({ onHover: () => setFocused(true), onBlur: () => setFocused(false) })
  const initialLoading = useInitialLoading()
  const empty = useEmpty()

  return (
    <Container ref={ref}>
      {!initialLoading && !empty && <ChartContainer />}
      {!initialLoading && !empty && <HorizontalNoData />}
      {!initialLoading && !empty && <Highlight />}
      {!initialLoading && empty && <CenterNoData />}
      {initialLoading && <SkeletonChart />}
      {focused && !empty && <Toolbox />}
      <Tooltip />
    </Container>
  )
}

export default ChartContentWrapper
