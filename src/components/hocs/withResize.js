import React, { useRef, memo, useLayoutEffect } from "react"
import { useChart } from "@/components/provider"
import { unregister } from "@/helpers/makeListeners"

export default Component => {
  const HeightComponent = ({
    height: defaultHeight = "100%",
    width: defaultWidth = "100%",
    flex = true,
    ...rest
  }) => {
    const chart = useChart()
    const ref = useRef()

    const height =
      (chart.getAttribute("enabledHeightResize") && chart.getAttribute("height")) || defaultHeight
    const width =
      (chart.getAttribute("enabledWidthResize") && chart.getAttribute("width")) || defaultWidth

    useLayoutEffect(() => {
      let initialHeight = 0
      let initialWidth = 0

      return unregister(
        chart
          .on("resizeStart", () => {
            initialHeight = ref.current.clientHeight
            initialWidth = ref.current.clientWidth
          })
          .on("resizeMove", (deltaY, deltaX) => {
            const nextHeight = deltaY ? initialHeight + deltaY : initialHeight
            const nextWidth = deltaX ? initialWidth + deltaX : initialWidth

            let resized = false

            if (
              chart.getAttribute("enabledHeightResize") &&
              nextHeight > 185 &&
              nextHeight !== initialHeight
            ) {
              const nextHeightAttribute = `${nextHeight}px`
              ref.current.style.height = nextHeightAttribute
              resized = true
            }

            if (
              chart.getAttribute("enabledWidthResize") &&
              nextWidth > 185 &&
              nextWidth !== initialWidth
            ) {
              const nextWidthAttribute = `${nextWidth}px`
              ref.current.style.width = nextWidthAttribute
              resized = true
            }

            if (resized) chart.getUI().trigger("resizing")
          })
          .on("resizeEnd", () => {
            chart.updateSize(ref.current.clientHeight, ref.current.clientWidth)
            chart.getUI().trigger("resize")
          }),
        chart.onAttributeChange("expanded", expanded => {
          chart.trigger("resizeStart")
          chart.trigger(
            "resizeEnd",
            expanded ? chart.getAttribute("expandedHeight") : -chart.getAttribute("expandedHeight"),
            0
          )
          chart.trigger("resizeEnd")
        })
      )
    }, [chart])

    return <Component ref={ref} height={height} width={width} flex={flex} {...rest} />
  }

  return memo(HeightComponent)
}
