import React, { useLayoutEffect, useRef, useState } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Tooltip from "./tooltip"
import Legend from "./legend"
import Toolbox from "./toolbox"
import Header from "./header"
import Details from "./details"
import DimensionFilter from "./dimensionFilter"
import withIntersection from "./withIntersection"

export const Chart = ({ chart }) => {
  const ref = useRef()
  const chartRef = useRef()
  const [detailsOpen, setDetailsOpen] = useState(false)

  useLayoutEffect(() => {
    chart.getUI().mount(chartRef.current)
    return () => chart.getUI().unmount()
  }, [])

  useLayoutEffect(() => {
    const mouseout = e => {
      let node = e.relatedTarget
      while (node && node !== ref.current) {
        node = node.parentElement
      }

      if (node !== ref.current) chart.blur()
    }
    ref.current.addEventListener("mouseover", chart.focus)
    ref.current.addEventListener("mouseout", mouseout)

    return () => {
      ref.current.removeEventListener("mouseover", chart.focus)
      ref.current.removeEventListener("mouseout", chart.blur)
    }
  }, [])

  return (
    <Flex ref={ref} round border={{ color: "borderSecondary", side: "all" }} column>
      <Header
        chart={chart}
        detailsOpen={detailsOpen}
        toggleDetails={() => setDetailsOpen(s => !s)}
      />
      <Flex style={{ position: "relative" }} column>
        <Flex style={{ position: "relative" }} padding={[0, 0, 4, 0]}>
          <div style={{ width: "100%" }} ref={chartRef}></div>
          <Toolbox chart={chart} />
          <Tooltip chart={chart} />
        </Flex>
        <Flex>
          <DimensionFilter chart={chart} />
          <Legend chart={chart} flex />
        </Flex>
        {detailsOpen && <Details chart={chart} />}
      </Flex>
    </Flex>
  )
}

export default Chart
