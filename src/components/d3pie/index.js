import React from "react"
import styled, { keyframes } from "styled-components"
import { Flex } from "@netdata/netdata-ui"
import ChartContainer from "@/components/chartContainer"
import { useAttributeValue, useOnResize } from "@/components/provider"
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
  background: "panelBg",
  round: "100%",
  width: "100%",
  height: "100%",
  ...props,
}))`
  animation: ${frames} 1.6s ease-in infinite;
`

export const D3pie = ({ uiName, ref, ...rest }) => {
  const loaded = useAttributeValue("loaded")
  const { width, height } = useOnResize(uiName)
  const size = width < height ? width : height

  return (
    <ChartWrapper alignItems="center" justifyContent="center" column ref={ref} {...rest}>
      {loaded ? (
        <StatsContainer position="relative" width="100%" height="100%" fontSize={`${size / 15}px`}>
          <ChartContainer uiName={uiName} />
        </StatsContainer>
      ) : (
        <Skeleton />
      )}
    </ChartWrapper>
  )
}

export default withChart(D3pie, { tile: true })
