import React, { useRef, memo, useLayoutEffect } from "react"
import { useChart } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"

export default Component => {
  const HeightComponent = ({ height: defaultHeight = "100%", flex = true, parentRef, ...rest }) => {
    const chart = useChart()
    const ref = useRef()

    const enabledHeightResize = chart.getAttribute("enabledHeightResize")
    const height = (enabledHeightResize && chart.getAttribute("height")) || defaultHeight

    useLayoutEffect(() => {
      let initialHeight = 0

      return unregister(
        chart
          .on("resizeYMove", delta => {
            const nextHeight = initialHeight + delta

            if (nextHeight < 185) return

            const nextHeightAttribute = `${nextHeight}px`
            ref.current.style.height = nextHeightAttribute
            chart.getUI().trigger("resize")
            chart.updateHeight(nextHeightAttribute)
          })
          .on("resizeYStart", () => {
            initialHeight = ref.current.clientHeight
          }),
        chart.onAttributeChange("expanded", expanded => {
          initialHeight = ref.current.clientHeight
          chart.trigger(
            "resizeYMove",
            expanded ? chart.getAttribute("expandedHeight") : -chart.getAttribute("expandedHeight")
          )
        })
      )
    }, [chart])

    useLayoutEffect(() => {
      if (!parentRef?.current && !ref.current) return

      chart.getUI().setEstimatedWidth(ref.current.offsetWidth)
      chart.getUI().setEstimatedHeight(ref.current.offsetHeight)
      if (parentRef?.current) chart.getUI().setParentWidth(parentRef.current.offsetWidth)
    }, [chart])

    return <Component ref={ref} height={height} flex={flex} {...rest} />
  }

  return memo(HeightComponent)
}
