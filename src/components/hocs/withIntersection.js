import React, { useRef, memo } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import { useAttributeValue, useChart } from "@/components/provider"

export default Component => {
  const IntersectionComponent = ({
    height: defaultHeight = "100%",
    width: defaultWidth = "100%",
    readOnly,
    ...rest
  }) => {
    const chart = useChart()
    const ref = useRef()
    const fullscreen = useAttributeValue("fullscreen")

    const height = fullscreen ? "100%" : defaultHeight

    const onVisibility = visible =>
      visible && chart.getUI().setEstimatedWidth(ref.current.offsetWidth)

    return (
      <Intersection
        ref={ref}
        height={height}
        width={defaultWidth}
        flex={true}
        fallback={chart.getAttribute("id")}
        onVisibility={onVisibility}
        data-testid="chartIntersector"
      >
        {() => <Component readOnly={readOnly} height={height} width="100%" flex {...rest} />}
      </Intersection>
    )
  }

  return memo(IntersectionComponent)
}
