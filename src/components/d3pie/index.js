import React, { forwardRef } from "react"
import ChartContainer from "@/components/chartContainer"
import { useAttributeValue, useOnResize } from "@/components/provider"
import styled, { keyframes } from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"

const StatsContainer = styled(Flex)`
  font-size: ${({ fontSize }) => fontSize};
`

const frames = keyframes`
  from { opacity: 0.2; }
  to { opacity: 0.6; }
`

export const Skeleton = styled(Flex).attrs(props => ({
  background: "borderSecondary",
  round: "100%",
  width: "100%",
  height: "100%",
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const D3pie = forwardRef((props, ref) => {
  const loaded = useAttributeValue("loaded")
  const { width, height } = useOnResize()
  const size = width < height ? width : height

  return (
    <ChartWrapper alignItems="center" justifyContent="center" column ref={ref}>
      {loaded ? (
        <StatsContainer position="relative" width="100%" height="100%" fontSize={`${size / 15}px`}>
          <ChartContainer />
        </StatsContainer>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
})

export default withChart(D3pie, { tile: true })
