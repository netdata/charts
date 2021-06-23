import React, { useLayoutEffect, useRef } from "react"
import Tooltip from "./tooltip"
import Legend from "./legend"
import Toolbox from "./toolbox"

const Chart = ({ chart }) => {
  const ref = useRef()

  useLayoutEffect(() => {
    chart.getUI().mount(ref.current)
    return () => chart.getUI().unmount()
  }, [])

  return (
    <div>
      <div style={{ position: "relative", width: "480px" }}>
        <div ref={ref}></div>
        <Toolbox chart={chart} />
        <Tooltip chart={chart} />
      </div>
      <Legend chart={chart} />
    </div>
  )
}

export default Chart
