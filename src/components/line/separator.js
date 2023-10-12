import React from "react"
import { Flex } from "@netdata/netdata-ui"

const Separator = ({ disabled }) => (
  <Flex width="1px" background={disabled ? "disabled" : "borderSecondary"} />
)

export default Separator
