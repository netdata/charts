import React, { forwardRef } from "react"
import Flex from "@netdata/netdata-ui/lib/components/templates/flex"
import GroupBoxes from "./groupBoxes"

const Container = forwardRef(({ renderBoxPopover, renderGroupPopover, ...rest }, ref) => (
  <Flex column width="100%" height="100%" gap={4} padding={[4, 2]} ref={ref} {...rest}>
    <GroupBoxes renderBoxPopover={renderBoxPopover} renderGroupPopover={renderGroupPopover} />
  </Flex>
))

export default Container
