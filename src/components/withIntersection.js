import React, { useEffect, useRef } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"

export default Component => {
  const IntersectionComponent = ({ chart, ...rest }) => {
    const ref = useRef()

    const onVisibility = visible => {
      if (visible) {
        chart.activate()
        chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
      } else {
        chart.deactivate()
      }
    }

    useEffect(() => () => chart.deactivate(), [])

    return (
      <Intersection
        height="450px"
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        ref={ref}
        {...rest}
      >
        {() => {
          return <Component chart={chart} height="450px" flex />
        }}
      </Intersection>
    )
  }

  return IntersectionComponent
}
