import React, { forwardRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import GroupBoxes from "./groupBoxes"

const Container = forwardRef((props, ref) => (
  <Flex column width="100%" height="100%" gap={4} padding={[4, 2]} ref={ref} {...props}>
    <GroupBoxes />
  </Flex>
))

export default Container
