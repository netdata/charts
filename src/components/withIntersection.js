import React, { useEffect, useRef, memo } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import { useAttributeValue, useChart } from "./provider"

export default Component => {
  const IntersectionComponent = ({ height: defaultHeight = "100%", readOnly, rest }) => {
    const chart = useChart()
    const ref = useRef()
    const fullscreen = useAttributeValue("fullscreen")

    const onVisibility = visible => {
      if (!visible) return chart.deactivate()

      chart.activate()
      chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
    }

    useEffect(() => () => chart.deactivate(), [chart])

    const height = fullscreen ? "500px" : defaultHeight

    return (
      <Intersection
        height={height}
        width="100%"
        flex={true}
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        ref={ref}
        data-testid="chartIntersector"
        {...rest}
      >
        {() => {
          return <Component readOnly={readOnly} height={height} width="100%" flex />
        }}
      </Intersection>
    )
  }

  return memo(IntersectionComponent)
}
