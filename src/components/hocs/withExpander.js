import React, { forwardRef } from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Drawer from "@/components/drawer"

export default Component => {
  const ExpandableComponent = forwardRef((props, ref) => {
    const expandable = useAttributeValue("expandable")
    const expanded = useAttributeValue("expanded")

    if (!expandable) return <Component {...props} ref={ref} />

    return (
      <>
        <Flex column gap={2} width={{ max: "inherit" }}>
          <Component {...props} ref={ref} />
        </Flex>
        {expanded && <Drawer />}
      </>
    )
  })

  return ExpandableComponent
}
