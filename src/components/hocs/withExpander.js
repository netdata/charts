import React from "react"
import { Flex } from "@netdata/netdata-ui"
import { useAttributeValue } from "@/components/provider"
import Drawer from "@/components/drawer"

export default Component => {
  const ExpandableComponent = props => {
    const expandable = useAttributeValue("expandable")
    const expanded = useAttributeValue("expanded")

    if (!expandable) return <Component {...props} />

    return (
      <>
        <Flex column gap={2} width={{ max: "inherit" }}>
          <Component {...props} />
        </Flex>
        {expanded && <Drawer />}
      </>
    )
  }

  return ExpandableComponent
}
