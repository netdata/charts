import React from "react"
import { Flex, Layer } from "@netdata/netdata-ui"
import { useAttributeValue, useChart } from "@/components/provider"

const Fullscreen = ({ children }) => {
  const chart = useChart()
  const fullscreen = useAttributeValue("fullscreen")

  if (!fullscreen) return children

  return (
    <Layer full onEsc={chart.toggleFullscreen}>
      <Flex background="mainBackground" flex width={{ max: "inherit" }} padding={[4]}>
        {children}
      </Flex>
    </Layer>
  )
}

export default Component => {
  const FullscreenComponent = props => {
    const fullscreen = useAttributeValue("fullscreen")

    return (
      <Fullscreen>
        <Component {...props} height={fullscreen ? "100%" : props.height} />
      </Fullscreen>
    )
  }

  return FullscreenComponent
}
