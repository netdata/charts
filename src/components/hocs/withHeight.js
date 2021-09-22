import React, { useRef, memo } from "react"
import { useChart, useListener } from "@/components/provider"

export default Component => {
  const HeightComponent = ({ height: defaultHeight = "100%", ...rest }) => {
    const chart = useChart()
    const ref = useRef()

    const height = chart.getAttribute("height") || defaultHeight

    useListener(() => {
      let initialHeight = 0

      return chart
        .on("resizeYMove", delta => {
          const nextHeight = `${initialHeight + delta}px`
          ref.current.style.height = nextHeight
          chart.getUI().trigger("resize")
          chart.updateHeight(nextHeight)
        })
        .on("resizeYStart", () => {
          initialHeight = ref.current.clientHeight
        })
    }, [chart])

    return <Component ref={ref} height={height} {...rest} />
  }

  return memo(HeightComponent)
}
