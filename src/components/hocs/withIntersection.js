import React, { memo, forwardRef } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import useForwardRef from "@netdata/netdata-ui/lib/hooks/use-forward-ref"
import { useAttributeValue, useChart } from "@/components/provider"

export default Component => {
  const IntersectionComponent = forwardRef(
    (
      {
        height: defaultHeight = "100%",
        width: defaultWidth = "100%",
        readOnly,
        flex = true,
        margin,
        padding,
        ...rest
      },
      parentRef
    ) => {
      const chart = useChart()
      const [ref, setRef] = useForwardRef(parentRef)
      const fullscreen = useAttributeValue("fullscreen")

      const height = fullscreen ? "100%" : defaultHeight

      const onVisibility = visible =>
        visible && chart.getUI().setEstimatedWidth(ref.current.offsetWidth)

      return (
        <Intersection
          ref={setRef}
          height={height}
          width={defaultWidth}
          flex={flex}
          margin={margin}
          padding={padding}
          fallback={chart.getAttribute("id")}
          onVisibility={onVisibility}
          data-testid="chartIntersector"
        >
          {() => <Component readOnly={readOnly} height="100%" width="100%" flex {...rest} />}
        </Intersection>
      )
    }
  )

  return memo(IntersectionComponent)
}
