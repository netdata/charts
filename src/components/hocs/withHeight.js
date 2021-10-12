import React, { useRef, memo } from "react"
import { useChart, useListener } from "@/components/provider"

export default Component => {
  const HeightComponent = ({ height: defaultHeight = "100%", ...rest }) => {
    const chart = useChart()
    const ref = useRef()

    const enabledHeightResize = chart.getAttribute("enabledHeightResize")
    const height = (enabledHeightResize && chart.getAttribute("height")) || defaultHeight

    useListener(() => {
      let initialHeight = 0

      return chart
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
        })
    }, [chart])

    return <Component ref={ref} height={height} {...rest} />
  }

  return memo(HeightComponent)
}
