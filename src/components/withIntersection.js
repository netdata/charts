import React, { useEffect, useRef, memo } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import { useAttributeValue } from "./useAttribute"

export default Component => {
  const IntersectionComponent = ({ chart, ...rest }) => {
    const ref = useRef()
    const fullscreen = useAttributeValue(chart, "fullscreen")

    const onVisibility = visible => {
      if (!visible) return chart.deactivate()

      chart.activate()
      chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
    }

    useEffect(() => () => chart.deactivate(), [])

    const height = fullscreen ? "500px" : "315px"

    return (
      <Intersection
        height={height}
        width="100%"
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        ref={ref}
        data-testid="chartIntersector"
        {...rest}
      >
        {() => {
          return <Component chart={chart} height={height} width="100%" flex {...rest} />
        }}
      </Intersection>
    )
  }

  return memo(IntersectionComponent)
}
