import React, { useLayoutEffect, useRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const ChartContainer = ({ uiName, ...rest }) => {
  const chart = useChart()
  const chartLibrary = useAttributeValue("chartLibrary")
  const ref = useRef()

  useLayoutEffect(() => {
    const ui = chart.getUI(uiName)
    ui.mount(ref.current)
    return () => ui.unmount()
  }, [chart, uiName, chartLibrary])

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
