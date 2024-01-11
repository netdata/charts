import React, { forwardRef } from "react"
import { Flex, Layer } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"

const Fullscreen = ({ children }) => {
  const fullscreen = useAttributeValue("fullscreen")

  if (!fullscreen) return children

  return (
    <Layer full>
      <Flex background="mainBackground" flex width={{ max: "inherit" }} padding={[4]}>
        {children}
      </Flex>
    </Layer>
  )
}

export default Component => {
  const FullscreenComponent = forwardRef((props, ref) => {
    const fullscreen = useAttributeValue("fullscreen")

    return (
      <Fullscreen>
        <Component {...props} height={fullscreen ? "100%" : props.height} ref={ref} />
      </Fullscreen>
    )
  })

  return FullscreenComponent
}
