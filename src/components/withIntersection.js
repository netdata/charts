import React, { useEffect, useRef, memo } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"

export default Component => {
  const IntersectionComponent = ({ chart, ...rest }) => {
    const ref = useRef()

    const onVisibility = visible => {
      if (!visible) return chart.deactivate()

      chart.activate()
      chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
    }

    useEffect(() => () => chart.deactivate(), [])

    return (
      <Intersection
        height="450px"
        width="100%"
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        ref={ref}
        {...rest}
      >
        {() => {
          return <Component chart={chart} height="450px" width="100%" flex {...rest} />
        }}
      </Intersection>
    )
  }

  return memo(IntersectionComponent)
}
