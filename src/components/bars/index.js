import React, { forwardRef } from "react"
import ChartContainer from "@/components/chartContainer"
import { useOnResize } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import Dimensions from "./dimensions"

export const BarsChart = forwardRef(({ uiName, ...rest }, ref) => {
  const { width, height } = useOnResize(uiName)
  const size = width < height ? width : height

  return (
    <ChartWrapper ref={ref}>
      <ChartContainer uiName={uiName} column gap={0.5} position="relative" {...rest}>
        <Dimensions size={size} height={height} width={width} />
      </ChartContainer>
    </ChartWrapper>
  )
})

export default withChart(BarsChart, { tile: true })
