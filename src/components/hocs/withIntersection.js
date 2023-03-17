import React, { memo, forwardRef, useCallback } from "react"
import Intersection from "@netdata/netdata-ui/lib/components/intersection"
import useForwardRef from "@netdata/netdata-ui/lib/hooks/use-forward-ref"
import { useAttributeValue, useChart } from "@/components/provider"
import { TextMicro } from "@netdata/netdata-ui/lib/components/typography"
import styled from "styled-components"

const FallbackContainer = styled(TextMicro).attrs({
  textAlign: "center",
  truncate: true,
  color: "borderSecondary",
})`
  width: 100%;
`

export const Fallback = props => {
  const chart = useChart()

  return <FallbackContainer {...props}>{chart.getAttribute("id")}</FallbackContainer>
}

export default (Component, { Fallback: DefaultFallback = Fallback } = {}) => {
  const IntersectionComponent = forwardRef(
    (
      {
        height: defaultHeight = "100%",
        width: defaultWidth = "100%",
        readOnly,
        flex = true,
        margin,
        padding,
        "data-chartid": dataChartId,
        "data-testid": dataTestId = "chartIntersector",
        parentRef,
        ...rest
      },
      ref
    ) => {
      const chart = useChart()
      const [myRef, setMyRef] = useForwardRef(ref)
      const fullscreen = useAttributeValue("fullscreen")

      const height = fullscreen ? "100%" : defaultHeight

      const onVisibility = useCallback(
        visible => {
          if (!parentRef?.current && !myRef.current) return
          if (!visible) return

          chart.getUI().setEstimatedWidth(myRef.current.offsetWidth)
          chart.getUI().setEstimatedHeight(myRef.current.offsetHeight)
          if (parentRef?.current) chart.getUI().setParentWidth(parentRef.current.offsetWidth)
        },
        [chart]
      )

      return (
        <Intersection
          ref={setMyRef}
          height="100%"
          width={defaultWidth}
          flex={flex}
          margin={margin}
          padding={padding}
          fallback={<DefaultFallback />}
          onVisibility={onVisibility}
          data-testid={dataTestId}
          data-chartid={dataChartId}
        >
          {() => <Component readOnly={readOnly} height={height} width="100%" flex {...rest} />}
        </Intersection>
      )
    }
  )

  return memo(IntersectionComponent)
}
