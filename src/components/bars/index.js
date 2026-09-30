import React from "react"
import ChartContainer from "@/components/chartContainer"
import { useOnResize, useIsModern } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import ModernBars from "@/components/modern/bars"
import Dimensions from "./dimensions"

export const BarsChart = ({ uiName, ref, ...rest }) => {
  const { height } = useOnResize(uiName)
  const isModern = useIsModern()

  return (
    <ChartWrapper ref={ref}>
      <ChartContainer uiName={uiName} column gap={0.5} position="relative" {...rest}>
        {isModern ? <ModernBars height={height} /> : <Dimensions height={height} />}
      </ChartContainer>
    </ChartWrapper>
  )
}

export default withChart(BarsChart, { tile: true })
