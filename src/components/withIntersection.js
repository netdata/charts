import React, { useEffect, useRef, memo } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import { useAttributeValue, useChart } from "./provider"

export default Component => {
  const IntersectionComponent = props => {
    const chart = useChart()
    const ref = useRef()
    const fullscreen = useAttributeValue("fullscreen")

    const onVisibility = visible => {
      if (!visible) return chart.deactivate()

      chart.activate()
      chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
    }

    useEffect(() => () => chart.deactivate(), [chart])

    const height = fullscreen ? "500px" : "315px"

    return (
      <Intersection
        height={height}
        width="100%"
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        ref={ref}
        data-testid="chartIntersector"
        {...props}
      >
        {() => {
          return <Component height={height} width="100%" flex />
        }}
      </Intersection>
    )
  }

  return memo(IntersectionComponent)
}
