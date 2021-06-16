import React from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"

export default Component => {
  const IntersectionComponent = props => {
    return (
      <Intersection fallback="fall">
        {() => {
          return <Component {...props} />
        }}
      </Intersection>
    )
  }

  return IntersectionComponent
}
