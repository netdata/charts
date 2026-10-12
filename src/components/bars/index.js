import React from "react"
import ChartContainer from "@/components/chartContainer"
import { useOnResize, useIsModern, useInitialLoading } from "@/components/provider"
import withChart from "@/components/hocs/withChart"
import { ChartWrapper } from "@/components/hocs/withTile"
import ModernBars from "@/components/modern/bars"
import { BarsSkeleton } from "@/components/skeleton"
import Dimensions from "./dimensions"

export const BarsChart = ({ uiName, ref, ...rest }) => {
  const { height } = useOnResize(uiName)
  const isModern = useIsModern()
  const initialLoading = useInitialLoading()

  return (
    <ChartWrapper ref={ref}>
      <ChartContainer uiName={uiName} column gap={0.5} position="relative" {...rest}>
        {isModern ? (
          initialLoading ? (
            <BarsSkeleton />
          ) : (
            <ModernBars height={height} />
          )
        ) : (
          <Dimensions height={height} />
        )}
      </ChartContainer>
    </ChartWrapper>
  )
}

export default withChart(BarsChart, { tile: true })
