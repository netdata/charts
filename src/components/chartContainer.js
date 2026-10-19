import React, { useLayoutEffect, useRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useChartUI } from "@/components/provider"

const ChartContainer = ({ uiName, ...rest }) => {
  const ui = useChartUI(uiName)
  const ref = useRef()

  useLayoutEffect(() => {
    ui.mount(ref.current)
    return () => ui.unmount()
  }, [ui])

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
