import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Layer from "@netdata/netdata-ui/lib/components/templates/layer"
import { useAttributeValue } from "./useAttribute"

export default Component => {
  const FullscreenComponent = ({ chart, ...rest }) => {
    const fullscreen = useAttributeValue(chart, "fullscreen")

    if (!fullscreen) return <Component chart={chart} {...rest} />

    return (
      <Layer full>
        <Flex background="mainBackground" flex padding={[4]}>
          <Component chart={chart} {...rest} />
        </Flex>
      </Layer>
    )
  }

  return FullscreenComponent
}
