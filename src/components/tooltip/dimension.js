import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Color from "@/components/dimensions/color"
import Name from "@/components/dimensions/name"
import Value from "@/components/dimensions/value"

const Dimension = ({ chart, id, strong }) => (
  <Flex gap={1} data-testid="chartTooltip-dimension">
    <Color chart={chart} id={id} height="12px" />
    <Flex as={Name} flex chart={chart} id={id} margin={[0, "auto"]} strong={strong} />
    <Value chart={chart} id={id} strong={strong} />
  </Flex>
)

export default Dimension
