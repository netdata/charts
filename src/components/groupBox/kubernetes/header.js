import React from "react"
import { H5 } from "@netdata/netdata-ui/lib/components/typography"

const Header = props => (
  <H5 color="bright" wordBreak="break-all" data-testid="k8sPopover-header" {...props} />
)

export default Header
