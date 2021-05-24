import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const LegendColor = ({ chart, index, ...rest }) => {
  return <Flex width="2px" background="success" {...rest} />
}

export default LegendColor
