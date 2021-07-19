import React from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"

const Separator = ({ disabled }) => (
  <Flex width="1px" background={disabled ? "disabled" : "borderSecondary"} />
)

export default Separator
