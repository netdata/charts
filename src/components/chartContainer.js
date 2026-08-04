import React, { useLayoutEffect, useRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useChartUI } from "@/components/provider"

const ChartContainer = ({ uiName, ...rest }) => {
  const chartUI = useChartUI(uiName)
  const ref = useRef()

  useLayoutEffect(() => {
    const element = ref.current
    if (chartUI.getElement() !== element) chartUI.mount(element)
    return () => chartUI.getElement() === element && chartUI.unmount()
  }, [chartUI])

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
