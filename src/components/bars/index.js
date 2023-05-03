import React, { forwardRef } from "react"
import styled from "styled-components"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import ChartContainer from "@/components/chartContainer"
import { useOnResize } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import Dimensions from "./dimensions"

const StatsContainer = styled(Flex).attrs({ gap: 1, column: true })`
  font-size: ${({ fontSize }) => fontSize};
`

export const NumberChart = forwardRef(({ uiName, ...rest }, ref) => {
  const { width, height } = useOnResize(uiName)
  const size = width < height ? width : height

  return (
    <ChartWrapper ref={ref}>
      <ChartContainer uiName={uiName} column alignItems="center" justifyContent="center" {...rest}>
        <StatsContainer column fontSize={`${size / 15}px`} position="relative">
          <Dimensions size={size} height={height} />
        </StatsContainer>
      </ChartContainer>
    </ChartWrapper>
  )
})

export default withChart(NumberChart, { tile: true })
