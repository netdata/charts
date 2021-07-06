import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import Color from "@/components/dimensions/color"
import Name from "@/components/dimensions/name"
import Value from "@/components/dimensions/value"

const Dimension = ({ id, strong }) => (
  <Flex gap={1} data-testid="chartTooltip-dimension">
    <Color id={id} height="12px" />
    <Flex as={Name} flex id={id} margin={[0, "auto"]} strong={strong} />
    <Value id={id} strong={strong} />
  </Flex>
)

export default Dimension
