import React, { forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Layer from "@netdata/netdata-ui/lib/components/templates/layer"
import { useAttributeValue } from "@/components/provider"

export default Component => {
  const FullscreenComponent = forwardRef((props, ref) => {
    const fullscreen = useAttributeValue("fullscreen")

    if (!fullscreen) return <Component {...props} ref={ref} />

    return (
      <Layer full>
        <Flex background="mainBackground" flex width={{ max: "inherit" }} padding={[4]}>
          <Component {...props} ref={ref} />
        </Flex>
      </Layer>
    )
  })

  return FullscreenComponent
}
