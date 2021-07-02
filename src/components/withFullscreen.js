import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Layer from "@netdata/netdata-ui/lib/components/templates/layer"
import { useAttributeValue, useChart } from "./provider"

export default Component => {
  const FullscreenComponent = props => {
    const fullscreen = useAttributeValue("fullscreen")

    if (!fullscreen) return <Component {...props} />

    return (
      <Layer full>
        <Flex background="mainBackground" flex padding={[4]}>
          <Component {...props} />
        </Flex>
      </Layer>
    )
  }

  return FullscreenComponent
}
