import React, { useLayoutEffect, useRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useChart } from "@/components/provider"

const ChartContainer = ({ uiName, ...rest }) => {
  const chart = useChart()
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI(uiName).mount(ref.current)
    return () => chart.getUI(uiName) && chart.getUI(uiName).unmount()
  }, [])

  return (
    <Flex
      data-testid="chartContent"
      ref={ref}
      height="100%"
      width="100%"
      overflow="hidden"
      {...rest}
    />
  )
}

export default ChartContainer
