import React, { useEffect } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"

export default Component => {
  const IntersectionComponent = ({ chart, ...rest }) => {
    const onVisibility = visible => {
      if (visible) {
        chart.activate()
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
