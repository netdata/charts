import React, { useLayoutEffect, useRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import { useChart } from "@/components/provider"

const ChartContainer = props => {
  const chart = useChart()
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI() && chart.getUI().unmount()
  }, [])

  return <Flex data-testid="chartContent" ref={ref} height="100%" width="100%" {...props} />
}

export default ChartContainer
