import React, { useLayoutEffect, useRef } from "react"
import Tooltip from "./tooltip"
import Legend from "./legend"

const Chart = ({ chart }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  })

  return (
    <div>
      <div style={{ position: "relative" }}>
        <div ref={ref}></div>
        <Tooltip chart={chart} />
      </div>
      <Legend chart={chart} />
    </div>
  )
}

export default Chart
