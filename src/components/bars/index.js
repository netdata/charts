import React from "react"
import ChartContainer from "@/components/chartContainer"
import { useOnResize } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import Dimensions from "./dimensions"

export const BarsChart = ({ uiName, ref, ...rest }) => {
  const { height } = useOnResize(uiName)

  return (
    <ChartWrapper ref={ref}>
      <ChartContainer uiName={uiName} column gap={0.5} position="relative" {...rest}>
        <Dimensions height={height} />
      </ChartContainer>
    </ChartWrapper>
  )
}

export default withChart(BarsChart, { tile: true })
