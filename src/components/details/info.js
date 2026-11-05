import React from "react"
import { TextSmall, Flex } from "@netdata/netdata-ui"

const Info = ({ title, children }) => (
  <Flex gap={2}>
    <TextSmall color="textDescription">{title}</TextSmall>
    <Flex as={TextSmall} background="elementBackground">
      {children}
    </Flex>
  </Flex>
)

export default Info
