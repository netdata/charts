import React from "react"
import { Flex } from "@netdata/netdata-ui"
import GroupBoxes from "./groupBoxes"

const Container = props => (
  <Flex column width="100%" height="100%" gap={4} padding={[4, 2]} {...props}>
    <GroupBoxes />
  </Flex>
)

export default Container
